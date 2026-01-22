"""
Pydantic schemas for entity extraction API.
"""

from pydantic import BaseModel, Field
from typing import Optional


class EntityRequest(BaseModel):
    """Request schema for entity extraction."""

    text: str = Field(
        ...,
        description="The text to extract entities from (abstract, clinical note, etc.)",
        min_length=1,
        max_length=50000
    )
    model: str = Field(
        default="biomedical-ner-all",
        description="NER model to use for extraction"
    )
    confidence_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence score for including entities"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The patient was treated with Metformin 500mg for Type 2 Diabetes. BRCA1 gene mutation was detected.",
                "model": "biomedical-ner-all",
                "confidence_threshold": 0.7
            }
        }


class EntityBatchRequest(BaseModel):
    """Request schema for batch entity extraction."""

    texts: list[str] = Field(
        ...,
        description="List of texts to extract entities from",
        min_length=1,
        max_length=100
    )
    model: str = Field(
        default="biomedical-ner-all",
        description="NER model to use for extraction"
    )
    confidence_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence score for including entities"
    )


class Entity(BaseModel):
    """Schema for a single extracted entity."""

    text: str = Field(..., description="The extracted entity text")
    type: str = Field(..., description="Entity type (Drug, Disease, Gene, etc.)")
    start: int = Field(..., ge=0, description="Start character position in original text")
    end: int = Field(..., ge=0, description="End character position in original text")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence score")
    color: str = Field(..., description="Suggested UI color for highlighting")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Metformin",
                "type": "Drug",
                "start": 32,
                "end": 41,
                "confidence": 0.9856,
                "color": "#4CAF50"
            }
        }


class EntitySummary(BaseModel):
    """Summary statistics for extracted entities."""

    total_entities: int = Field(..., description="Total number of entities found")
    by_type: dict[str, int] = Field(..., description="Count of entities by type")
    unique_counts: dict[str, int] = Field(..., description="Count of unique entities by type")


class EntityResponse(BaseModel):
    """Response schema for entity extraction."""

    success: bool = Field(default=True, description="Whether extraction succeeded")
    entities: list[Entity] = Field(..., description="List of extracted entities")
    summary: EntitySummary = Field(..., description="Summary statistics")
    text_length: int = Field(..., description="Length of input text")
    model_used: str = Field(..., description="Model used for extraction")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "entities": [
                    {
                        "text": "Metformin",
                        "type": "Drug",
                        "start": 32,
                        "end": 41,
                        "confidence": 0.9856,
                        "color": "#4CAF50"
                    },
                    {
                        "text": "Type 2 Diabetes",
                        "type": "Disease",
                        "start": 52,
                        "end": 67,
                        "confidence": 0.9234,
                        "color": "#F44336"
                    }
                ],
                "summary": {
                    "total_entities": 2,
                    "by_type": {"Drug": 1, "Disease": 1},
                    "unique_counts": {"Drug": 1, "Disease": 1}
                },
                "text_length": 95,
                "model_used": "biomedical-ner-all"
            }
        }


class EntityBatchResponse(BaseModel):
    """Response schema for batch entity extraction."""

    success: bool = Field(default=True)
    results: list[EntityResponse] = Field(..., description="List of results per input text")
    total_texts: int = Field(..., description="Number of texts processed")


class ErrorResponse(BaseModel):
    """Error response schema."""

    success: bool = Field(default=False)
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
