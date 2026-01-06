from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from suggest_service import SuggestService

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize suggest service
suggest_service = SuggestService()


@app.route('/suggest-timetable', methods=['POST'])
def suggest_timetable():
    """
    API endpoint to receive course sections and student preferences, 
    then return flattened data for Gemini API.
    
    Expected request body:
    {
        "courseSections": [...],
        "studentPreferences": "Tôi muốn học vào buổi sáng, không học thứ 7"
    }
    
    Returns:
        Flattened course sections data ready for Gemini API
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'Request body is required'
            }), 400

        course_sections = data.get('courseSections', [])

        if not course_sections:
            return jsonify({
                'error': 'courseSections array is required'
            }), 400

        if not isinstance(course_sections, list):
            return jsonify({
                'error': 'courseSections must be an array'
            }), 400

        # Extract student preferences (optional)
        student_preferences: str = data.get('studentPreferences', '')
        if student_preferences and not isinstance(student_preferences, str):
            return jsonify({
                'error': 'studentPreferences must be a string'
            }), 400

        # Generate suggestions using suggest service (flattening is done inside service)
        suggestions_result = suggest_service.suggest(course_sections, student_preferences)

        # Check if suggestion failed and return 400 status code
        if not suggestions_result.get('success', False):
            error_message = suggestions_result.get('error', 'Failed to generate suggestions')
            return jsonify({
                'message': error_message,
                'error': error_message,
                'detail': error_message
            }), 400

        return jsonify(suggestions_result), 200

    except Exception as e:
        logger.error(f'Error processing request: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'timetable-suggest-api'
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
