"""
FastAPI routes for entity extraction.
"""

from fastapi import APIRouter, HTTPException, status
from ..schemas.entity import (
    EntityRequest,
    EntityBatchRequest,
    EntityResponse,
    EntityBatchResponse,
    ErrorResponse,
    EntitySummary
)
from ..services.entity_extractor import EntityExtractor, get_extractor

router = APIRouter(prefix="/entities", tags=["Entity Extraction"])


@router.post(
    "/extract",
    response_model=EntityResponse,
    responses={
        200: {"description": "Entities extracted successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Extraction failed"}
    },
    summary="Extract biomedical entities from text",
    description="Extract drugs, diseases, genes, and other biomedical entities from an abstract or clinical text."
)
async def extract_entities(request: EntityRequest) -> EntityResponse:
    """
    Extract biomedical entities from input text.

    - **text**: The text to extract entities from
    - **model**: NER model to use (default: biomedical-ner-all)
    - **confidence_threshold**: Minimum confidence score (0-1)
    """
    try:
        extractor = get_extractor(
            model_name=request.model,
            confidence_threshold=request.confidence_threshold
        )

        entities = extractor.extract_entities(request.text)
        summary_data = extractor.get_entity_summary(entities)

        return EntityResponse(
            success=True,
            entities=entities,
            summary=EntitySummary(**summary_data),
            text_length=len(request.text),
            model_used=request.model
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Entity extraction failed: {str(e)}"
        )


@router.post(
    "/extract/batch",
    response_model=EntityBatchResponse,
    responses={
        200: {"description": "Batch extraction successful"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Extraction failed"}
    },
    summary="Extract entities from multiple texts",
    description="Batch extraction of biomedical entities from multiple abstracts."
)
async def extract_entities_batch(request: EntityBatchRequest) -> EntityBatchResponse:
    """
    Extract biomedical entities from multiple texts.

    - **texts**: List of texts to process
    - **model**: NER model to use
    - **confidence_threshold**: Minimum confidence score
    """
    try:
        extractor = get_extractor(
            model_name=request.model,
            confidence_threshold=request.confidence_threshold
        )

        results = []
        for text in request.texts:
            entities = extractor.extract_entities(text)
            summary_data = extractor.get_entity_summary(entities)

            results.append(EntityResponse(
                success=True,
                entities=entities,
                summary=EntitySummary(**summary_data),
                text_length=len(text),
                model_used=request.model
            ))

        return EntityBatchResponse(
            success=True,
            results=results,
            total_texts=len(request.texts)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch extraction failed: {str(e)}"
        )


@router.get(
    "/models",
    summary="List available NER models",
    description="Get list of supported NER models for entity extraction."
)
async def list_models() -> dict:
    """List available NER models."""
    return {
        "models": [
            {
                "id": "biomedical-ner-all",
                "name": "Biomedical NER (All Entities)",
                "description": "Extracts Drug, Disease, Gene, Species entities",
                "huggingface_path": "d4data/biomedical-ner-all",
                "recommended": True
            },
            {
                "id": "biobert-diseases",
                "name": "BioBERT Diseases",
                "description": "Specialized for disease entity extraction",
                "huggingface_path": "alvaroalon2/biobert_diseases_ner",
                "recommended": False
            },
            {
                "id": "clinical-ner",
                "name": "Clinical NER",
                "description": "Clinical notes entity extraction",
                "huggingface_path": "samrawal/bert-base-uncased_clinical-ner",
                "recommended": False
            }
        ],
        "default": "biomedical-ner-all"
    }


@router.get(
    "/entity-types",
    summary="List supported entity types",
    description="Get list of entity types that can be extracted with their UI colors."
)
async def list_entity_types() -> dict:
    """List supported entity types and their colors."""
    return {
        "entity_types": [
            {"type": "Drug", "color": "#4CAF50", "description": "Medications, chemicals, compounds"},
            {"type": "Disease", "color": "#F44336", "description": "Diseases, conditions, disorders"},
            {"type": "Gene_or_gene_product", "color": "#2196F3", "description": "Genes, proteins"},
            {"type": "Species", "color": "#FF9800", "description": "Organisms, species references"},
            {"type": "Chemical", "color": "#9C27B0", "description": "Chemical compounds"},
            {"type": "Symptom", "color": "#E91E63", "description": "Clinical symptoms"},
            {"type": "Procedure", "color": "#00BCD4", "description": "Medical procedures"}
        ]
    }
