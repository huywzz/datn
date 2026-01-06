"""
Service for suggesting timetable using Gemini API
"""
from typing import List, Dict, Any, Optional
import logging
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from models import CourseSection, CourseFlatten
from prompt import build_prompt, get_score_sections_function_schema

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class SuggestService:
    """Service for generating timetable suggestions"""

    def __init__(self):
        """Initialize the suggest service"""
        # Initialize Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-lite')

        if not api_key:
            raise ValueError('GEMINI_API_KEY is required in environment variables')

        genai.configure(api_key=api_key)
        try:
            function_schema = get_score_sections_function_schema()
            self.gemini_model = genai.GenerativeModel(
                self.model_name,
                tools=[{
                    "function_declarations": [function_schema]
                }]
            )
            logger.info('Gemini API initialized successfully with function calling support')
        except Exception as e:
            logger.warning(f'Failed to initialize Gemini API with function calling: {e}')
            logger.debug(f'Error details: {type(e).__name__}: {str(e)}', exc_info=True)
            try:
                self.gemini_model = genai.GenerativeModel(self.model_name)
                logger.info('Gemini API initialized without function calling (fallback)')
            except Exception as e2:
                logger.error(f'Failed to initialize Gemini model: {e2}')
                raise ValueError(f'Failed to initialize Gemini API: {e2}') from e2

    def flatten_course_sections(self, course_sections: List[Dict[str, Any]]) -> List[CourseFlatten]:
        """
        Flatten course sections data by merging course, instructor, and class schedules
        into a single object. Only keep necessary fields for Gemini API.
        
        Args:
            course_sections: List of course sections with nested relations
            
        Returns:
            List of CourseFlatten objects with only necessary data
        """
        flattened = []

        for section_data in course_sections:
            # Parse CourseSection from dictionary
            section = CourseSection.from_dict(section_data)
            if not section:
                continue

            # Convert to flattened format
            flattened_section = CourseFlatten.from_course_section(section)
            flattened.append(flattened_section)

        return flattened

    def suggest(
            self,
            course_sections: List[Dict[str, Any]],
            preferences: str
    ) -> Dict[str, Any]:
        """
        Generate timetable suggestions based on course sections and student preferences.
        
        Flow:
        1. Flatten course sections
        2. Call Gemini API to get [sectionId, score] pairs
        3. Sort suggestions using algorithm
        4. Return list of suggested sectionIds
        
        Args:
            course_sections: List of course sections with nested relations (raw data from API)
            preferences: Student preferences as a string
            
        Returns:
            Dictionary containing:
            - success: bool
            - sectionIds: List[int] (if success) - List of suggested section IDs
            - error: str (if failed)
        """
        try:
            # Validate inputs
            if not course_sections:
                return {
                    'success': False,
                    'error': 'No course sections provided',
                    'sectionIds': []
                }

            if not isinstance(course_sections, list):
                return {
                    'success': False,
                    'error': 'course_sections must be a list',
                    'sectionIds': []
                }

            # Normalize preferences (remove extra whitespace)
            preferences = preferences.strip() if preferences else ''

            # Log preferences
            logger.info('=' * 80)
            logger.info('SUGGEST TIMETABLE - DEBUG INFO')
            logger.info('=' * 80)
            logger.info(f'Preferences: {preferences if preferences else "(empty)"}')
            logger.info('-' * 80)

            # Parse CourseSection objects for sorting
            course_section_objects: List[CourseSection] = []
            for section_data in course_sections:
                section = CourseSection.from_dict(section_data)
                if section:
                    course_section_objects.append(section)

            logger.info(f'Parsed {len(course_section_objects)} course sections')

            # Step 1: Call Gemini API to get [sectionId, score] pairs (flattening happens inside)
            scored_sections = self._call_gemini_api(course_sections, preferences)

            if not scored_sections:
                logger.warning('No suggestions returned from Gemini API')
                return {
                    'success': False,
                    'error': 'No suggestions returned from Gemini API',
                    'sectionIds': []
                }

            # Log flattened data with scores
            logger.info('Scored sections:')
            for section_id_str, score in scored_sections.items():
                section_id = int(section_id_str)
                # Find corresponding section for additional info
                section_info = next((s for s in course_section_objects if s.sectionId == section_id), None)
                if section_info and section_info.course:
                    logger.info(
                        f'  SectionId: {section_id} | Score: {score:.2f} | Course: {section_info.course.name} | SectionCode: {section_info.sectionCode}')
                else:
                    logger.info(f'  SectionId: {section_id} | Score: {score:.2f}')
            logger.info('-' * 80)

            # Step 2: Sort suggestions using algorithm
            suggested_section_ids = self._sort_suggestions(scored_sections, course_section_objects)

            # Log suggested section IDs
            logger.info(f'Suggested section IDs (sorted): {suggested_section_ids}')
            logger.info(f'Total suggested sections: {len(suggested_section_ids)}')
            logger.info('=' * 80)

            return {
                'success': True,
                'sectionIds': suggested_section_ids
            }

        except Exception as e:
            logger.error(f'Error generating suggestions: {str(e)}', exc_info=True)
            return {
                'success': False,
                'error': f'Failed to generate suggestions: {str(e)}',
                'sectionIds': []
            }

    def _call_gemini_api(
            self,
            course_sections: List[Dict[str, Any]],
            preferences: str
    ) -> Dict[str, float]:
        """
        Call Gemini API to get scored section suggestions.
        This method will flatten the course sections internally.
        
        Args:
            course_sections: List of course sections with nested relations (raw data)
            preferences: Student preferences
            
        Returns:
            Dictionary mapping sectionId (string) to score (float)
            Example: {"1": 0.95, "2": 0.87}
        """
        # Flatten course sections for Gemini API
        flattened_data = self.flatten_course_sections(course_sections)
        logger.info(f'Flattened {len(flattened_data)} course sections for Gemini API')

        if not self.gemini_model:
            raise ValueError('Gemini API model is not initialized')

        try:
            # Build prompt
            prompt = build_prompt(flattened_data, preferences)
            logger.debug(f'Prompt length: {len(prompt)} characters')

            # Call Gemini API with function calling
            logger.info('Calling Gemini API with function calling...')
            response = self.gemini_model.generate_content(prompt)

            # Check if function was called
            try:
                if (response.candidates and
                        len(response.candidates) > 0 and
                        response.candidates[0].content and
                        response.candidates[0].content.parts and
                        len(response.candidates[0].content.parts) > 0):

                    part = response.candidates[0].content.parts[0]

                    # Check if this part contains a function call
                    if hasattr(part, 'function_call') and part.function_call:
                        function_call = part.function_call

                        if function_call.name == 'score_course_sections':
                            # Extract scores from function call arguments
                            # function_call.args might be a dict or MessageDict
                            if hasattr(function_call.args, 'get'):
                                function_args = function_call.args
                            elif isinstance(function_call.args, dict):
                                function_args = function_call.args
                            else:
                                # Try to convert to dict
                                function_args = dict(function_call.args) if hasattr(function_call.args,
                                                                                    '__dict__') else {}

                            scores_data = function_args.get('scores', {})
                            
                            # If scores is a string (JSON), parse it
                            if isinstance(scores_data, str):
                                try:
                                    scored_sections = json.loads(scores_data)
                                except json.JSONDecodeError:
                                    logger.error(f'Failed to parse scores JSON: {scores_data}')
                                    scored_sections = {}
                            else:
                                scored_sections = scores_data
                            
                            # Validate and convert to proper format
                            result: Dict[str, float] = {}
                            for section_id_str, score in scored_sections.items():
                                try:
                                    score_float = float(score)
                                    # Clamp score between 0.0 and 1.0
                                    score_float = max(0.0, min(1.0, score_float))
                                    result[str(section_id_str)] = round(score_float, 2)
                                except (ValueError, TypeError):
                                    logger.warning(f'Invalid score for section {section_id_str}: {score}')
                                    continue

                            logger.info(
                                f'Successfully received {len(result)} scored sections from Gemini API function call')
                            return result
                        else:
                            logger.warning(
                                f'Unexpected function call: {function_call.name}, trying to parse text response')
                            # Fallback to text parsing
                            return self._parse_text_response(response, flattened_data)
                    else:
                        logger.debug('No function call in response parts, trying to parse text response')
                        # Fallback to text parsing
                        return self._parse_text_response(response, flattened_data)
                else:
                    logger.warning('Invalid response structure, trying to parse text response')
                    # Fallback to text parsing
                    return self._parse_text_response(response, flattened_data)
            except AttributeError as e:
                logger.warning(f'Error accessing function call in response: {e}, trying to parse text response')
                # Fallback to text parsing
                return self._parse_text_response(response, flattened_data)

        except Exception as e:
            logger.error(f'Error calling Gemini API: {str(e)}', exc_info=True)
            raise

    def _parse_text_response(
            self,
            response: Any,
            flattened_data: List[CourseFlatten]
    ) -> Dict[str, float]:
        """
        Parse text response from Gemini API (fallback when function calling is not used).
        
        Args:
            response: Gemini API response object
            flattened_data: List of CourseFlatten objects
            
        Returns:
            Dictionary mapping sectionId (string) to score (float)
        """
        try:
            response_text = response.text.strip()
            logger.debug(f'Gemini API text response: {response_text[:200]}...')

            # Try to extract JSON from response
            # Remove markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()

            # Parse JSON
            response_data = json.loads(response_text)
            scored_sections = response_data.get('scores', {})

            # Validate and convert to proper format
            result: Dict[str, float] = {}
            for section_id_str, score in scored_sections.items():
                try:
                    score_float = float(score)
                    # Clamp score between 0.0 and 1.0
                    score_float = max(0.0, min(1.0, score_float))
                    result[str(section_id_str)] = round(score_float, 2)
                except (ValueError, TypeError):
                    logger.warning(f'Invalid score for section {section_id_str}: {score}')
                    continue

            logger.info(f'Successfully parsed {len(result)} scored sections from text response')
            return result

        except (json.JSONDecodeError, AttributeError) as e:
            logger.error(f'Failed to parse text response from Gemini API: {e}')
            logger.error(f'Response text: {response_text if "response_text" in locals() else "N/A"}')
            raise ValueError(f'Failed to parse Gemini API response: {e}') from e

    def _has_schedule_conflict(
            self,
            section1: CourseSection,
            section2: CourseSection
    ) -> bool:
        """
        Check if two course sections have schedule conflicts.
        
        Args:
            section1: First course section
            section2: Second course section
            
        Returns:
            True if there is a schedule conflict, False otherwise
        """
        for schedule1 in section1.classSchedules:
            for schedule2 in section2.classSchedules:
                # Check if same day of week
                if schedule1.dayOfWeek != schedule2.dayOfWeek:
                    continue

                # Check if periods overlap
                # Overlap occurs if: start1 <= end2 AND end1 >= start2
                if (schedule1.startPeriod <= schedule2.endPeriod and
                        schedule1.endPeriod >= schedule2.startPeriod):
                    return True

        return False

    def _has_same_course(
            self,
            section1: CourseSection,
            section2: CourseSection
    ) -> bool:
        """
        Check if two sections belong to the same course.
        
        Args:
            section1: First course section
            section2: Second course section
            
        Returns:
            True if same course, False otherwise
        """
        return section1.courseId == section2.courseId

    def _is_valid_addition(
            self,
            new_section: CourseSection,
            selected_sections: List[CourseSection]
    ) -> bool:
        """
        Check if a new section can be added to the selected sections.
        
        Args:
            new_section: Section to be added
            selected_sections: List of already selected sections
            
        Returns:
            True if can be added (no conflicts), False otherwise
        """
        for selected in selected_sections:
            # Check if same course
            if self._has_same_course(new_section, selected):
                return False

            # Check schedule conflict
            if self._has_schedule_conflict(new_section, selected):
                return False

        return True

    def _calculate_total_score(
            self,
            section_ids: frozenset[int],
            score_map: Dict[str, float]
    ) -> float:
        """
        Calculate total score for a set of section IDs.
        
        Args:
            section_ids: Set of section IDs (int)
            score_map: Dictionary mapping sectionId (string) to score
            
        Returns:
            Total score
        """
        return sum(score_map.get(str(sid), 0.0) for sid in section_ids)

    def _sort_suggestions(
            self,
            scored_sections: Dict[str, float],
            course_sections: List[CourseSection]
    ) -> List[int]:
        """
        Sort suggestions using beam search algorithm.
        
        Constraints:
        - Each course can only have one section selected
        - No schedule conflicts between selected sections
        - Maximize total score
        
        Args:
            scored_sections: Dictionary mapping sectionId (string) to score (float) from Gemini API
            course_sections: List of CourseSection objects
            
        Returns:
            List of sectionIds that maximize total score while satisfying constraints
        """
        if not scored_sections or not course_sections:
            return []

        # Create section map for quick lookup
        section_map: Dict[int, CourseSection] = {
            section.sectionId: section
            for section in course_sections
        }

        # Filter: only consider sections that exist in both maps
        # Convert string keys to int for comparison
        valid_section_ids = [
            int(sid_str) for sid_str in scored_sections.keys()
            if int(sid_str) in section_map
        ]

        if not valid_section_ids:
            return []

        # Sort sections by score descending for better beam search
        valid_section_ids.sort(key=lambda sid: scored_sections.get(str(sid), 0.0), reverse=True)

        # Beam search parameters
        beam_width = 10  # Number of states to keep at each step

        # Initialize beam with empty state
        # State: frozenset of section IDs (hashable)
        beam: List[frozenset[int]] = [frozenset()]

        # Process each section
        for section_id in valid_section_ids:
            new_section = section_map[section_id]
            new_beam: List[frozenset[int]] = []

            # Try adding this section to each state in current beam
            for state in beam:
                # Try adding new section
                selected_sections = [section_map[sid] for sid in state]

                if self._is_valid_addition(new_section, selected_sections):
                    new_state = state | {section_id}
                    new_beam.append(new_state)

                # Also keep the original state (don't add this section)
                new_beam.append(state)

            # Keep only top beam_width states by total score
            new_beam.sort(
                key=lambda state: self._calculate_total_score(state, scored_sections),
                reverse=True
            )
            beam = new_beam[:beam_width]

        # Return the best state (highest total score)
        if not beam:
            return []

        best_state = max(
            beam,
            key=lambda state: self._calculate_total_score(state, scored_sections)
        )

        # Convert to list and sort by score descending for consistent output
        result = list(best_state)
        result.sort(key=lambda sid: scored_sections.get(str(sid), 0.0), reverse=True)

        logger.info(
            f'Beam search selected {len(result)} sections with total score: {self._calculate_total_score(best_state, scored_sections):.2f}')

        return result
