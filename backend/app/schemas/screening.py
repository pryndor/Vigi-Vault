"""
Pydantic schemas for screening workflow.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class ReviewDecision(str, Enum):
    """Review decision options."""
    PENDING = "pending"
    INCLUDE = "include"
    EXCLUDE = "exclude"
    MAYBE = "maybe"


class ArticleSource(str, Enum):
    """Supported article sources."""
    PUBMED = "pubmed"
    EUROPEPMC = "europepmc"
    PMC = "pmc"
    PREPRINT = "preprint"
    MANUAL = "manual"


class SearchRequest(BaseModel):
    """Request to search for articles."""
    query: str = Field(..., min_length=1, description="Search query")
    source: ArticleSource = Field(
        default=ArticleSource.PUBMED,
        description="Data source to search"
    )
    max_results: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Maximum number of results"
    )
    project_name: Optional[str] = Field(
        None,
        description="Name for this screening project"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query": "metformin adverse events diabetes",
                "source": "pubmed",
                "max_results": 100,
                "project_name": "Metformin Safety Review"
            }
        }


class ArticleSchema(BaseModel):
    """Schema for an article in the screening queue."""
    id: str = Field(..., description="Unique article ID")
    pmid: Optional[str] = Field(None, description="PubMed ID if available")
    doi: Optional[str] = Field(None, description="DOI if available")
    title: str = Field(..., description="Article title")
    abstract: str = Field(default="", description="Article abstract")
    authors: list[str] = Field(default=[], description="List of authors")
    journal: str = Field(default="", description="Journal name")
    pub_date: str = Field(default="", description="Publication date")
    keywords: list[str] = Field(default=[], description="Article keywords")
    source: str = Field(default="pubmed", description="Data source")

    # Screening fields
    decision: ReviewDecision = Field(
        default=ReviewDecision.PENDING,
        description="Review decision"
    )
    reviewer_notes: Optional[str] = Field(None, description="Reviewer notes")
    reviewed_at: Optional[datetime] = Field(None, description="Review timestamp")

    # Entity extraction
    entities_extracted: bool = Field(
        default=False,
        description="Whether entities have been extracted"
    )
    entities: list[dict] = Field(
        default=[],
        description="Extracted entities"
    )


class ScreeningProject(BaseModel):
    """Schema for a screening project."""
    id: str = Field(..., description="Project ID")
    name: str = Field(..., description="Project name")
    query: str = Field(..., description="Search query used")
    source: ArticleSource = Field(..., description="Data source")
    created_at: datetime = Field(default_factory=datetime.now)

    # Statistics
    total_articles: int = Field(default=0)
    pending_count: int = Field(default=0)
    included_count: int = Field(default=0)
    excluded_count: int = Field(default=0)
    maybe_count: int = Field(default=0)


class ReviewRequest(BaseModel):
    """Request to submit a review decision."""
    article_id: str = Field(..., description="Article ID to review")
    decision: ReviewDecision = Field(..., description="Review decision")
    notes: Optional[str] = Field(None, description="Optional reviewer notes")

    class Config:
        json_schema_extra = {
            "example": {
                "article_id": "12345678",
                "decision": "include",
                "notes": "Relevant RCT with clear adverse event reporting"
            }
        }


class SearchResponse(BaseModel):
    """Response after creating a screening project."""
    success: bool = True
    project_id: str
    project_name: str
    query: str
    source: str
    total_articles: int
    message: str


class QueueResponse(BaseModel):
    """Response with current article for review."""
    success: bool = True
    has_more: bool = Field(..., description="Whether there are more articles to review")
    position: int = Field(..., description="Current position in queue (1-indexed)")
    total: int = Field(..., description="Total articles in queue")
    pending: int = Field(..., description="Remaining pending articles")
    article: Optional[ArticleSchema] = Field(None, description="Current article to review")


class ReviewResponse(BaseModel):
    """Response after submitting a review."""
    success: bool = True
    article_id: str
    decision: ReviewDecision
    message: str
    next_article: Optional[ArticleSchema] = Field(
        None,
        description="Next article in queue (if any)"
    )
    stats: dict = Field(..., description="Updated project statistics")


class ProjectStatsResponse(BaseModel):
    """Response with project statistics."""
    project_id: str
    project_name: str
    total: int
    pending: int
    included: int
    excluded: int
    maybe: int
    progress_percent: float
