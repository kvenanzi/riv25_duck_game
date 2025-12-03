"""
Property-based tests for Duck Generator backend

Tests the correctness properties defined in the design document.
"""

import pytest
from hypothesis import given, strategies as st, settings
from duck_agent import quack_enhance_prompt


# Feature: duck-generator, Property 13: Prompt enhancement includes "duck"
# Validates: Requirements 8.1, 8.2
@given(description=st.text(min_size=1, max_size=1024))
@settings(max_examples=100)
def test_property_13_prompt_enhancement_includes_duck(description):
    """
    Property 13: Prompt enhancement includes "duck"
    
    For any user description submitted to the backend, the enhanced prompt
    should include the word "duck" (case-insensitive).
    
    This ensures that all prompts sent to the AI model will generate duck images,
    regardless of whether the user explicitly mentioned "duck" in their input.
    """
    enhanced = quack_enhance_prompt(description)
    
    # The enhanced prompt must contain "duck" (case-insensitive)
    assert 'duck' in enhanced.lower(), \
        f"Enhanced prompt '{enhanced}' does not contain 'duck'"
    
    # If the original description contained "duck", it should be preserved
    if 'duck' in description.lower():
        assert description == enhanced, \
            f"Original description with 'duck' was modified unnecessarily"
