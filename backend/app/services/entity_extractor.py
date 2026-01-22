"""
Entity Extractor Service for Biomedical NER

Uses HuggingFace transformers to extract biomedical entities from abstracts.
Primary model: d4data/biomedical-ner-all
Entities: Drug, Disease, Gene, Species
"""

from typing import Optional
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
from functools import lru_cache


class EntityExtractor:
    """
    Biomedical Named Entity Recognition using HuggingFace Transformers.

    Extracts: Drugs, Diseases, Genes, Species from medical abstracts.
    """

    SUPPORTED_MODELS = {
        "biomedical-ner-all": "d4data/biomedical-ner-all",
        "biobert-diseases": "alvaroalon2/biobert_diseases_ner",
        "clinical-ner": "samrawal/bert-base-uncased_clinical-ner",
    }

    # Entity type color mapping for UI
    ENTITY_COLORS = {
        "Drug": "#4CAF50",
        "Disease": "#F44336",
        "Gene_or_gene_product": "#2196F3",
        "Species": "#FF9800",
        "Chemical": "#9C27B0",
        "Symptom": "#E91E63",
        "Procedure": "#00BCD4",
    }

    def __init__(
        self,
        model_name: str = "biomedical-ner-all",
        device: int = -1,  # -1 for CPU, 0+ for GPU
        confidence_threshold: float = 0.7
    ):
        """
        Initialize the entity extractor.

        Args:
            model_name: Key from SUPPORTED_MODELS or full HuggingFace model path
            device: -1 for CPU, 0+ for specific GPU
            confidence_threshold: Minimum confidence score to include entity
        """
        self.model_path = self.SUPPORTED_MODELS.get(model_name, model_name)
        self.device = device
        self.confidence_threshold = confidence_threshold
        self._pipeline = None

    @property
    def pipeline(self):
        """Lazy load the NER pipeline."""
        if self._pipeline is None:
            self._pipeline = self._load_pipeline()
        return self._pipeline

    def _load_pipeline(self):
        """Load the HuggingFace NER pipeline."""
        try:
            tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            model = AutoModelForTokenClassification.from_pretrained(self.model_path)

            return pipeline(
                "ner",
                model=model,
                tokenizer=tokenizer,
                aggregation_strategy="simple",
                device=self.device
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load NER model '{self.model_path}': {e}")

    def extract_entities(self, text: str) -> list[dict]:
        """
        Extract biomedical entities from text.

        Args:
            text: Input text (abstract, clinical note, etc.)

        Returns:
            List of entity dictionaries with keys:
            - text: The extracted entity text
            - type: Entity type (Drug, Disease, Gene, etc.)
            - start: Start character position
            - end: End character position
            - confidence: Model confidence score
            - color: Suggested UI color for highlighting
        """
        if not text or not text.strip():
            return []

        # Run NER pipeline
        raw_entities = self.pipeline(text)

        # Process and filter entities
        entities = []
        for entity in raw_entities:
            score = entity.get("score", 0)

            # Filter by confidence threshold
            if score < self.confidence_threshold:
                continue

            entity_type = entity.get("entity_group", "Unknown")

            entities.append({
                "text": entity.get("word", ""),
                "type": entity_type,
                "start": entity.get("start", 0),
                "end": entity.get("end", 0),
                "confidence": round(score, 4),
                "color": self.ENTITY_COLORS.get(entity_type, "#757575")
            })

        # Merge adjacent entities of same type
        entities = self._merge_adjacent_entities(entities)

        return entities

    def _merge_adjacent_entities(self, entities: list[dict]) -> list[dict]:
        """
        Merge adjacent entities of the same type that were split by tokenization.
        """
        if not entities:
            return []

        merged = []
        current = entities[0].copy()

        for next_entity in entities[1:]:
            # Check if entities should be merged (same type, adjacent/close)
            if (current["type"] == next_entity["type"] and
                next_entity["start"] - current["end"] <= 1):
                # Merge: extend current entity
                current["text"] = current["text"] + " " + next_entity["text"]
                current["end"] = next_entity["end"]
                current["confidence"] = min(current["confidence"], next_entity["confidence"])
            else:
                merged.append(current)
                current = next_entity.copy()

        merged.append(current)
        return merged

    def extract_entities_batch(self, texts: list[str]) -> list[list[dict]]:
        """
        Extract entities from multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of entity lists, one per input text
        """
        return [self.extract_entities(text) for text in texts]

    def get_entity_summary(self, entities: list[dict]) -> dict:
        """
        Get summary statistics for extracted entities.

        Args:
            entities: List of extracted entities

        Returns:
            Summary with counts per entity type
        """
        summary = {
            "total_entities": len(entities),
            "by_type": {},
            "unique_entities": {}
        }

        for entity in entities:
            entity_type = entity["type"]
            entity_text = entity["text"].lower()

            # Count by type
            if entity_type not in summary["by_type"]:
                summary["by_type"][entity_type] = 0
            summary["by_type"][entity_type] += 1

            # Track unique entities
            if entity_type not in summary["unique_entities"]:
                summary["unique_entities"][entity_type] = set()
            summary["unique_entities"][entity_type].add(entity_text)

        # Convert sets to counts
        summary["unique_counts"] = {
            k: len(v) for k, v in summary["unique_entities"].items()
        }
        del summary["unique_entities"]

        return summary


# Singleton instance for reuse
@lru_cache(maxsize=1)
def get_extractor(
    model_name: str = "biomedical-ner-all",
    confidence_threshold: float = 0.7
) -> EntityExtractor:
    """Get cached EntityExtractor instance."""
    return EntityExtractor(
        model_name=model_name,
        confidence_threshold=confidence_threshold
    )


# Convenience function for quick extraction
def extract_entities(
    text: str,
    model_name: str = "biomedical-ner-all",
    confidence_threshold: float = 0.7
) -> list[dict]:
    """
    Quick entity extraction from text.

    Args:
        text: Input text
        model_name: Model to use
        confidence_threshold: Minimum confidence

    Returns:
        List of extracted entities
    """
    extractor = get_extractor(model_name, confidence_threshold)
    return extractor.extract_entities(text)
