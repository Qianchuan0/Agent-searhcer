"""Image generation provider module for agent Researcher."""

from .image_generator import ImageGeneratorProvider
from .modelslab_image_generator import ModelsLabImageGeneratorProvider

__all__ = ["ImageGeneratorProvider", "ModelsLabImageGeneratorProvider"]
