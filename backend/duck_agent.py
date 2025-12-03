"""
Duck Generator Agent using Strands and Nova Canvas MCP

This agent receives duck descriptions and generates images using AWS Bedrock Nova Canvas.
Pre-configured for the re:Invent booth challenge.
"""

from mcp import StdioServerParameters, stdio_client
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import glob
import random

app = Flask(__name__)
CORS(app)

# Initialize Nova Canvas MCP Client
nova_canvas_client = MCPClient(
    lambda: stdio_client(
        StdioServerParameters(
            command="uvx", 
            args=["awslabs.nova-canvas-mcp-server@latest"]
        )
    )
)

# Configure Bedrock Model
# Using cross-region inference profile for Claude 3.5 Haiku
bedrock_model = BedrockModel(
    model_id="us.anthropic.claude-3-5-haiku-20241022-v1:0",
    temperature=0.7,
)

# Duck-themed system prompt
SYSTEM_PROMPT = """
You are an expert duck painter and artist. 

When users describe a duck they want to see, you create it using the Nova Canvas image generation tools.

Guidelines:
- Always ensure the prompt includes "duck" 
- Be creative and add artistic details to make the duck interesting
- If the user's description is vague, add duck-appropriate details
- Respond with encouraging, duck-themed messages
- Use duck puns when appropriate (but don't overdo it)

Example transformations:
- "a duck in space" → "a detailed duck wearing a realistic spacesuit, floating in space with stars and planets in the background, digital art"
- "cool duck" → "a duck wearing sunglasses and a leather jacket, looking confident, vibrant colors, digital illustration"
"""


@app.route('/health', methods=['GET'])
def quack_pond_status():
    """
    Check the duck pond health status
    
    Duck-themed health check endpoint that reports if the generator is ready.
    """
    return jsonify({"status": "healthy", "message": "Quack! Duck generator is ready!"})


@app.route('/api/duck/generate', methods=['POST'])
def waddle_hatch_duck():
    """
    Waddle over and hatch a duck image based on user description
    
    Duck-themed endpoint that generates custom duck images using AI.
    
    Request body:
    {
        "description": "a duck wearing sunglasses"
    }
    
    Response:
    {
        "image": "base64_encoded_image_data",
        "message": "Quack! Here's your duck!",
        "prompt_used": "enhanced prompt that was sent to Nova Canvas",
        "is_fallback": false
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({
                "error": "Quack! Please provide a duck description.",
                "message": "Missing 'description' field in request",
                "success": False
            }), 400
        
        description = data['description'].strip()
        
        # Validate description length
        if not description:
            return jsonify({
                "error": "Quack! Please describe your duck before we start hatching.",
                "message": "Empty description provided",
                "success": False
            }), 400
        
        if len(description) > 1024:
            return jsonify({
                "error": "Quack! That's too much duck description. Keep it under 1024 characters!",
                "message": "Description exceeds maximum length of 1024 characters",
                "success": False
            }), 400
        
        # Enhance description to include "duck" if not present
        enhanced_description = quack_enhance_prompt(description)
        
        # Try to generate duck using the agent
        image_data = None
        is_fallback = False
        generation_error = None
        
        try:
            with nova_canvas_client:
                all_tools = nova_canvas_client.list_tools_sync()
                agent = Agent(
                    tools=all_tools, 
                    model=bedrock_model, 
                    system_prompt=SYSTEM_PROMPT
                )
                
                # Ask agent to create the duck
                print(f"🦆 Original description: {description}")
                print(f"🦆 Enhanced description: {enhanced_description}")
                response = agent(f"Create an image: {enhanced_description}")
                print(f"✅ Agent response received")
                
                # Extract image from response
                image_data = pluck_duck_from_pond(response)
                print(f"✅ Image data extracted: {len(image_data) if image_data else 0} chars")
                
        except Exception as gen_error:
            generation_error = str(gen_error)
            print(f"⚠️ Generation failed: {gen_error}")
            print("🔄 Attempting to use fallback duck...")
            image_data = None
        
        # If generation failed, use a fallback duck
        if not image_data:
            print("🔄 Fetching fallback duck...")
            image_data = fetch_backup_duckling()
            is_fallback = True
            
            if image_data:
                print(f"✅ Using fallback duck")
                return jsonify({
                    "image": image_data,
                    "message": "Quack! Here's a pre-made duck for you!",
                    "prompt_used": enhanced_description,
                    "is_fallback": True,
                    "success": True
                })
            else:
                print(f"❌ No fallback ducks available")
                error_details = f"Generation failed: {generation_error}" if generation_error else "No fallback ducks found"
                return jsonify({
                    "error": "Quack! The duck pond is having trouble right now. Please try again in a moment.",
                    "message": error_details,
                    "success": False
                }), 500
        
        return jsonify({
            "image": image_data,
            "message": "Quack quack! Your duck is ready!",
            "prompt_used": enhanced_description,
            "is_fallback": False,
            "success": True
        })
    
    except Exception as e:
        print(f"❌ Error in waddle_hatch_duck: {e}")
        import traceback
        traceback.print_exc()
        
        # Last resort: try fallback duck
        print("🔄 Last resort: attempting fallback duck...")
        fallback = fetch_backup_duckling()
        if fallback:
            print("✅ Last resort fallback successful")
            return jsonify({
                "image": fallback,
                "message": "Quack! Here's a pre-made duck for you!",
                "is_fallback": True,
                "success": True
            })
        
        print("❌ All duck generation attempts failed")
        return jsonify({
            "error": "Quack! Something went wrong while hatching your duck. Please try again.",
            "message": str(e),
            "success": False
        }), 500


def quack_enhance_prompt(description):
    """
    Quack-enhance user description to ensure it includes "duck"
    
    Duck-themed prompt enhancement that naturally adds "duck" to descriptions
    that don't already include it, maintaining the user's creative intent.
    
    Args:
        description: User's duck description
        
    Returns:
        Enhanced description that includes "duck"
    """
    if 'duck' in description.lower():
        return description
    
    # Add "a duck" naturally to the description
    description = description.strip()
    
    # Handle common patterns
    if description.startswith(('wearing', 'with', 'in', 'on', 'at')):
        return f"a duck {description}"
    elif description.startswith(('cool', 'cute', 'funny', 'silly', 'happy', 'sad', 'angry')):
        return f"a {description} duck"
    else:
        # Default: prepend "a duck"
        return f"a duck {description}"


def pluck_duck_from_pond(response):
    """
    Pluck the freshly hatched duck image from the pond
    
    Duck-themed function that extracts the generated image from the agent response.
    The Nova Canvas MCP saves images to the output folder, and this function
    finds the most recently hatched duck and returns it as base64 data.
    
    Args:
        response: Agent response from Nova Canvas
        
    Returns:
        Base64-encoded image data URL, or empty string if no duck found
    """
    print("=" * 50)
    print("🦆 PLUCK_DUCK_FROM_POND CALLED")
    print("=" * 50)
    
    # Nova Canvas saves images to backend/output/ folder
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    output_dir = os.path.abspath(output_dir)
    
    print(f"🔍 Looking for images in: {output_dir}")
    print(f"🔍 Directory exists: {os.path.exists(output_dir)}")
    
    # Get the most recently created PNG file
    png_files = glob.glob(os.path.join(output_dir, '*.png'))
    print(f"🔍 Found {len(png_files)} PNG files")
    
    if png_files:
        # Sort by modification time, get most recent
        latest_file = max(png_files, key=os.path.getmtime)
        print(f"✅ Using latest file: {latest_file}")
        
        # Read the file and convert to base64
        with open(latest_file, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        print(f"✅ Converted to base64 ({len(image_data)} chars)")
        
        # Return as data URL
        return f"data:image/png;base64,{image_data}"
    
    # Fallback: return empty
    print("❌ No PNG files found!")
    return ""


def fetch_backup_duckling():
    """
    Fetch a backup duckling from the emergency duck pond
    
    Duck-themed fallback function that retrieves a pre-generated duck image
    when the AI generation waddles into trouble. Randomly selects from
    available backup ducklings to keep things interesting.
    
    Returns:
        Base64-encoded image data URL, or None if no backup ducklings exist
    """
    print("=" * 50)
    print("🦆 GETTING FALLBACK DUCK")
    print("=" * 50)
    
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    output_dir = os.path.abspath(output_dir)
    
    # Get all PNG files (these are our fallback ducks)
    png_files = glob.glob(os.path.join(output_dir, '*.png'))
    print(f"🔍 Found {len(png_files)} fallback ducks")
    
    if not png_files:
        print("❌ No fallback ducks available")
        return None
    
    # Pick a random duck
    random_duck = random.choice(png_files)
    print(f"✅ Selected fallback duck: {os.path.basename(random_duck)}")
    
    try:
        # Read the file and convert to base64
        with open(random_duck, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        print(f"✅ Converted to base64 ({len(image_data)} chars)")
        
        # Return as data URL
        return f"data:image/png;base64,{image_data}"
    except Exception as e:
        print(f"❌ Error reading fallback duck: {e}")
        return None


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8081))
    
    # Check for fallback ducks
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    fallback_count = len(glob.glob(os.path.join(output_dir, '*.png')))
    
    print("\n" + "="*50)
    print("🦆 Duck Generator Agent")
    print("="*50)
    print(f"✅ Starting on port {port}...")
    print(f"✅ Nova Canvas MCP configured")
    print(f"🦆 Fallback ducks available: {fallback_count}")
    print(f"✅ Ready to generate ducks!")
    print(f"\n🔗 Health check: http://localhost:{port}/health")
    print(f"🔗 Generate endpoint: http://localhost:{port}/api/duck/generate")
    print("\n" + "="*50 + "\n")
    app.run(host='0.0.0.0', port=port, debug=True)
