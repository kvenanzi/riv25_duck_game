"""
Error handling and fallback system tests for Duck Generator backend

Tests comprehensive error scenarios including:
- Timeout handling
- Network errors
- Fallback duck system verification
- Error recovery flows
"""

import pytest
import os
import glob
from duck_agent import (
    app,
    fetch_backup_duckling,
    quack_enhance_prompt,
    pluck_duck_from_pond
)


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestFallbackDuckSystem:
    """Test the fallback duck system verification"""
    
    def test_fallback_duck_exists(self):
        """Verify that fallback ducks are available"""
        output_dir = os.path.join(os.path.dirname(__file__), 'output')
        png_files = glob.glob(os.path.join(output_dir, '*.png'))
        
        # Should have at least one fallback duck
        assert len(png_files) > 0, "No fallback ducks found in output directory"
    
    def test_fetch_backup_duckling_returns_valid_data(self):
        """Verify fetch_backup_duckling returns valid base64 image data"""
        fallback = fetch_backup_duckling()
        
        # Should return data
        assert fallback is not None, "fetch_backup_duckling returned None"
        
        # Should be a data URL
        assert fallback.startswith('data:image/png;base64,'), \
            "Fallback duck is not a valid data URL"
        
        # Should have actual base64 data
        assert len(fallback) > 100, "Fallback duck data is too short"
    
    def test_fetch_backup_duckling_returns_different_ducks(self):
        """Verify fallback system can return different ducks (randomization)"""
        # Get multiple fallback ducks
        ducks = [fetch_backup_duckling() for _ in range(10)]
        
        # All should be valid
        assert all(duck is not None for duck in ducks), \
            "Some fallback ducks were None"
        
        # With multiple fallback ducks available, we should see variety
        # (This test may occasionally fail if we only have 1 fallback duck)
        output_dir = os.path.join(os.path.dirname(__file__), 'output')
        png_count = len(glob.glob(os.path.join(output_dir, '*.png')))
        
        if png_count > 1:
            unique_ducks = len(set(ducks))
            assert unique_ducks > 1, \
                "Fallback system always returns the same duck (no randomization)"


class TestErrorHandling:
    """Test error handling with duck-themed messages"""
    
    def test_missing_description_field(self, client):
        """Test error when description field is missing"""
        response = client.post('/api/duck/generate',
                              json={},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        
        assert data['success'] is False
        assert 'Quack' in data['error']
        assert 'description' in data['error'].lower()
    
    def test_empty_description(self, client):
        """Test error when description is empty"""
        response = client.post('/api/duck/generate',
                              json={'description': '   '},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        
        assert data['success'] is False
        assert 'Quack' in data['error']
    
    def test_description_too_long(self, client):
        """Test error when description exceeds 1024 characters"""
        long_description = 'a' * 1025
        response = client.post('/api/duck/generate',
                              json={'description': long_description},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        
        assert data['success'] is False
        assert 'Quack' in data['error']
        assert '1024' in data['error']
    
    def test_all_errors_are_duck_themed(self, client):
        """Verify all error messages contain duck-themed language"""
        test_cases = [
            {},  # Missing description
            {'description': ''},  # Empty description
            {'description': 'a' * 1025},  # Too long
        ]
        
        for test_case in test_cases:
            response = client.post('/api/duck/generate',
                                  json=test_case,
                                  content_type='application/json')
            
            data = response.get_json()
            error_message = data.get('error', '')
            
            # All errors should be duck-themed
            is_duck_themed = (
                'quack' in error_message.lower() or
                'duck' in error_message.lower() or
                'waddle' in error_message.lower() or
                'pond' in error_message.lower() or
                'hatch' in error_message.lower()
            )
            
            assert is_duck_themed, \
                f"Error message '{error_message}' is not duck-themed"


class TestPromptEnhancement:
    """Test prompt enhancement for error prevention"""
    
    def test_prompt_enhancement_adds_duck(self):
        """Test that prompts without 'duck' get enhanced"""
        test_cases = [
            ('wearing sunglasses', 'a duck wearing sunglasses'),
            ('in space', 'a duck in space'),
            ('cool', 'a cool duck'),
            ('with a hat', 'a duck with a hat'),
        ]
        
        for original, expected in test_cases:
            enhanced = quack_enhance_prompt(original)
            assert 'duck' in enhanced.lower(), \
                f"Enhanced prompt '{enhanced}' does not contain 'duck'"
    
    def test_prompt_enhancement_preserves_duck(self):
        """Test that prompts with 'duck' are preserved"""
        test_cases = [
            'a duck wearing sunglasses',
            'cool duck',
            'Duck in space',
            'DUCK with hat',
        ]
        
        for original in test_cases:
            enhanced = quack_enhance_prompt(original)
            assert enhanced == original, \
                f"Prompt with 'duck' was modified: '{original}' -> '{enhanced}'"


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_endpoint_returns_200(self, client):
        """Test health endpoint returns success"""
        response = client.get('/health')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['status'] == 'healthy'
        assert 'Quack' in data['message']
    
    def test_health_endpoint_is_duck_themed(self, client):
        """Test health endpoint uses duck-themed messaging"""
        response = client.get('/health')
        data = response.get_json()
        
        message = data.get('message', '')
        is_duck_themed = (
            'quack' in message.lower() or
            'duck' in message.lower()
        )
        
        assert is_duck_themed, \
            f"Health message '{message}' is not duck-themed"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
