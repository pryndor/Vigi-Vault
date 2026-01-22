"""
PubMed Search Service

Uses NCBI E-utilities API to search and fetch articles from PubMed.
API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
"""

import httpx
from typing import Optional
from dataclasses import dataclass
import xml.etree.ElementTree as ET


@dataclass
class Article:
    """Represents a PubMed article."""
    pmid: str
    title: str
    abstract: str
    authors: list[str]
    journal: str
    pub_date: str
    doi: Optional[str] = None
    keywords: list[str] = None
    source: str = "pubmed"

    def to_dict(self) -> dict:
        return {
            "pmid": self.pmid,
            "title": self.title,
            "abstract": self.abstract,
            "authors": self.authors,
            "journal": self.journal,
            "pub_date": self.pub_date,
            "doi": self.doi,
            "keywords": self.keywords or [],
            "source": self.source
        }


class PubMedSearchService:
    """
    Service for searching PubMed via NCBI E-utilities.

    Usage:
        service = PubMedSearchService()
        results = await service.search("diabetes metformin adverse events", max_results=100)
    """

    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_key: Optional[str] = None, email: Optional[str] = None):
        """
        Initialize PubMed search service.

        Args:
            api_key: NCBI API key (optional, increases rate limit from 3 to 10 req/sec)
            email: Email for NCBI to contact if issues (recommended)
        """
        self.api_key = api_key
        self.email = email

    def _build_params(self, **kwargs) -> dict:
        """Build request parameters with optional API key and email."""
        params = {k: v for k, v in kwargs.items() if v is not None}
        if self.api_key:
            params["api_key"] = self.api_key
        if self.email:
            params["email"] = self.email
        return params

    async def search(
        self,
        query: str,
        max_results: int = 100,
        sort: str = "relevance"
    ) -> dict:
        """
        Search PubMed and return article IDs.

        Args:
            query: Search query (supports PubMed query syntax)
            max_results: Maximum number of results to return
            sort: Sort order - "relevance" or "pub_date"

        Returns:
            Dict with count and list of PMIDs
        """
        params = self._build_params(
            db="pubmed",
            term=query,
            retmax=max_results,
            sort=sort,
            retmode="json"
        )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/esearch.fcgi",
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

        result = data.get("esearchresult", {})
        return {
            "total_count": int(result.get("count", 0)),
            "pmids": result.get("idlist", []),
            "query": query
        }

    async def fetch_articles(self, pmids: list[str]) -> list[Article]:
        """
        Fetch full article details for given PMIDs.

        Args:
            pmids: List of PubMed IDs

        Returns:
            List of Article objects
        """
        if not pmids:
            return []

        params = self._build_params(
            db="pubmed",
            id=",".join(pmids),
            retmode="xml"
        )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/efetch.fcgi",
                params=params,
                timeout=60.0
            )
            response.raise_for_status()

        return self._parse_pubmed_xml(response.text)

    def _parse_pubmed_xml(self, xml_text: str) -> list[Article]:
        """Parse PubMed XML response into Article objects."""
        articles = []
        root = ET.fromstring(xml_text)

        for article_elem in root.findall(".//PubmedArticle"):
            try:
                medline = article_elem.find(".//MedlineCitation")
                article_data = medline.find(".//Article")

                # PMID
                pmid = medline.find(".//PMID").text

                # Title
                title_elem = article_data.find(".//ArticleTitle")
                title = self._get_text(title_elem)

                # Abstract
                abstract_elem = article_data.find(".//Abstract")
                abstract = ""
                if abstract_elem is not None:
                    abstract_texts = abstract_elem.findall(".//AbstractText")
                    abstract_parts = []
                    for at in abstract_texts:
                        label = at.get("Label", "")
                        text = self._get_text(at)
                        if label:
                            abstract_parts.append(f"{label}: {text}")
                        else:
                            abstract_parts.append(text)
                    abstract = " ".join(abstract_parts)

                # Authors
                authors = []
                author_list = article_data.find(".//AuthorList")
                if author_list is not None:
                    for author in author_list.findall(".//Author"):
                        last_name = author.find(".//LastName")
                        fore_name = author.find(".//ForeName")
                        if last_name is not None:
                            name = last_name.text or ""
                            if fore_name is not None and fore_name.text:
                                name = f"{fore_name.text} {name}"
                            authors.append(name)

                # Journal
                journal_elem = article_data.find(".//Journal/Title")
                journal = self._get_text(journal_elem)

                # Publication Date
                pub_date_elem = article_data.find(".//Journal/JournalIssue/PubDate")
                pub_date = self._parse_date(pub_date_elem)

                # DOI
                doi = None
                for id_elem in article_elem.findall(".//ArticleId"):
                    if id_elem.get("IdType") == "doi":
                        doi = id_elem.text
                        break

                # Keywords
                keywords = []
                for kw in medline.findall(".//KeywordList/Keyword"):
                    if kw.text:
                        keywords.append(kw.text)

                articles.append(Article(
                    pmid=pmid,
                    title=title,
                    abstract=abstract,
                    authors=authors,
                    journal=journal,
                    pub_date=pub_date,
                    doi=doi,
                    keywords=keywords,
                    source="pubmed"
                ))

            except Exception as e:
                # Skip malformed articles
                continue

        return articles

    def _get_text(self, elem) -> str:
        """Safely get text from XML element."""
        if elem is None:
            return ""
        # Handle mixed content (text with child elements)
        return "".join(elem.itertext()).strip()

    def _parse_date(self, date_elem) -> str:
        """Parse PubMed date element."""
        if date_elem is None:
            return ""

        year = date_elem.find("Year")
        month = date_elem.find("Month")
        day = date_elem.find("Day")

        parts = []
        if year is not None and year.text:
            parts.append(year.text)
        if month is not None and month.text:
            parts.append(month.text)
        if day is not None and day.text:
            parts.append(day.text)

        return "-".join(parts) if parts else ""

    async def search_and_fetch(
        self,
        query: str,
        max_results: int = 100,
        sort: str = "relevance"
    ) -> dict:
        """
        Search PubMed and fetch full article details in one call.

        Args:
            query: Search query
            max_results: Maximum results
            sort: Sort order

        Returns:
            Dict with search metadata and full article details
        """
        search_result = await self.search(query, max_results, sort)
        articles = await self.fetch_articles(search_result["pmids"])

        return {
            "query": query,
            "total_count": search_result["total_count"],
            "returned_count": len(articles),
            "articles": [a.to_dict() for a in articles]
        }


# Convenience function
async def search_pubmed(
    query: str,
    max_results: int = 100,
    api_key: Optional[str] = None
) -> dict:
    """Quick PubMed search."""
    service = PubMedSearchService(api_key=api_key)
    return await service.search_and_fetch(query, max_results)
