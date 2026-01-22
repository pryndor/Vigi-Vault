"""
Europe PMC Search Service

Uses Europe PMC REST API to search articles.
API Documentation: https://europepmc.org/RestfulWebService
"""

import httpx
from typing import Optional
from dataclasses import dataclass


@dataclass
class Article:
    """Represents an article from Europe PMC."""
    id: str
    source: str
    title: str
    abstract: str
    authors: list[str]
    journal: str
    pub_date: str
    doi: Optional[str] = None
    pmid: Optional[str] = None
    pmcid: Optional[str] = None
    keywords: list[str] = None
    is_open_access: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source": self.source,
            "title": self.title,
            "abstract": self.abstract,
            "authors": self.authors,
            "journal": self.journal,
            "pub_date": self.pub_date,
            "doi": self.doi,
            "pmid": self.pmid,
            "pmcid": self.pmcid,
            "keywords": self.keywords or [],
            "is_open_access": self.is_open_access
        }


class EuropePMCSearchService:
    """
    Service for searching Europe PMC.

    Europe PMC includes:
    - PubMed/MEDLINE
    - PMC (full text)
    - Preprints (bioRxiv, medRxiv)
    - Patents
    - Agricultural literature

    Usage:
        service = EuropePMCSearchService()
        results = await service.search("diabetes metformin", max_results=100)
    """

    BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest"

    async def search(
        self,
        query: str,
        max_results: int = 100,
        page: int = 1,
        sort: str = "RELEVANCE",
        source: Optional[str] = None
    ) -> dict:
        """
        Search Europe PMC.

        Args:
            query: Search query
            max_results: Maximum results per page (max 1000)
            page: Page number (1-indexed)
            sort: Sort order - "RELEVANCE", "P_PDATE_D" (date desc), "CITED" (citations)
            source: Filter by source - "MED" (PubMed), "PMC", "PPR" (preprints)

        Returns:
            Dict with search results and metadata
        """
        params = {
            "query": query,
            "format": "json",
            "pageSize": min(max_results, 1000),
            "page": page,
            "sort": sort
        }

        if source:
            params["query"] = f"(SRC:{source}) AND ({query})"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search",
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

        result_list = data.get("resultList", {}).get("result", [])
        articles = [self._parse_article(r) for r in result_list]

        return {
            "query": query,
            "total_count": data.get("hitCount", 0),
            "returned_count": len(articles),
            "page": page,
            "articles": [a.to_dict() for a in articles]
        }

    def _parse_article(self, data: dict) -> Article:
        """Parse Europe PMC result into Article object."""
        # Authors
        authors = []
        author_string = data.get("authorString", "")
        if author_string:
            authors = [a.strip() for a in author_string.split(",")]

        # Keywords
        keywords = []
        keyword_list = data.get("keywordList", {}).get("keyword", [])
        if keyword_list:
            keywords = keyword_list

        return Article(
            id=data.get("id", ""),
            source=data.get("source", "europepmc"),
            title=data.get("title", ""),
            abstract=data.get("abstractText", ""),
            authors=authors,
            journal=data.get("journalTitle", ""),
            pub_date=data.get("firstPublicationDate", ""),
            doi=data.get("doi"),
            pmid=data.get("pmid"),
            pmcid=data.get("pmcid"),
            keywords=keywords,
            is_open_access=data.get("isOpenAccess", "N") == "Y"
        )

    async def search_pubmed(self, query: str, max_results: int = 100) -> dict:
        """Search only PubMed via Europe PMC."""
        return await self.search(query, max_results, source="MED")

    async def search_preprints(self, query: str, max_results: int = 100) -> dict:
        """Search only preprints (bioRxiv, medRxiv)."""
        return await self.search(query, max_results, source="PPR")

    async def search_pmc(self, query: str, max_results: int = 100) -> dict:
        """Search only PMC (full text articles)."""
        return await self.search(query, max_results, source="PMC")

    async def get_article_by_id(
        self,
        article_id: str,
        source: str = "MED"
    ) -> Optional[Article]:
        """
        Get single article by ID.

        Args:
            article_id: Article ID (PMID for PubMed, etc.)
            source: Source database (MED, PMC, PPR)
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search",
                params={
                    "query": f"(SRC:{source}) AND (EXT_ID:{article_id})",
                    "format": "json",
                    "pageSize": 1
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("resultList", {}).get("result", [])
        if results:
            return self._parse_article(results[0])
        return None


# Convenience function
async def search_europepmc(query: str, max_results: int = 100) -> dict:
    """Quick Europe PMC search."""
    service = EuropePMCSearchService()
    return await service.search(query, max_results)
