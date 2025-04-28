#!/usr/bin/env python3

import os
import sys
import importlib.util
import subprocess

# Define exit keywords
EXIT_KEYWORDS = ['exit', 'quit', 'q']

def check_if_exit(input_value):
    """Check if the input is an exit command."""
    if input_value.lower() in EXIT_KEYWORDS:
        print("\n👋 Exiting Program Requirements Adder. Goodbye!")
        sys.exit(0)
    return input_value

# Skip package checking - assume packages are already installed
# Import required packages directly
try:
    from dotenv import load_dotenv
    from supabase import create_client
    from datetime import datetime
except ImportError as e:
    print(f"❌ Error importing required packages: {str(e)}")
    print("Please install the required packages manually:")
    print("    pip install python-dotenv")
    print("    pip install supabase")
    sys.exit(1)

# Load environment variables from .env.local
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
if not load_dotenv(env_path):
    print("Error: Could not load .env.local file")
    sys.exit(1)

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Using service role key for database operations

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Required environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not found")
    sys.exit(1)

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase successfully!")
except Exception as e:
    print(f"❌ Error initializing Supabase client: {str(e)}")
    sys.exit(1)

def display_available_programs():
    """Display all available programs from the database to help user selection."""
    try:
        # Fetch all programs from the database
        result = supabase.table('programs').select('id, program_name, coop_program').order('program_name').execute()
        
        if not result.data:
            print("❌ No programs found in the database.")
            return
        
        print("\n📋 Available Programs:")
        print("-" * 70)
        print(f"{'ID':<5} | {'PROGRAM NAME':<50} | {'CO-OP':<8}")
        print("-" * 70)
        
        for program in result.data:
            program_id = program.get('id', 'N/A')
            program_name = program.get('program_name', 'N/A')
            coop = "Yes" if program.get('coop_program') else "No"
            
            # Truncate long names to fit in the display
            if len(program_name) > 48:
                program_name = program_name[:45] + "..."
                
            print(f"{program_id:<5} | {program_name:<50} | {coop:<8}")
        
        print("-" * 70)
    except Exception as e:
        print(f"❌ Error fetching programs: {str(e)}")

def get_program_id():
    """Ask the user for the program ID."""
    # Display available programs to help the user
    display_available_programs()
    
    while True:
        try:
            print("\n⚠️  Important: Select a program ID from the list above.")
            print(f"Type any of {', '.join(EXIT_KEYWORDS)} to exit the program at any time.")
            program_id_input = input("\nEnter the program ID: ")
            
            # Check if user wants to exit
            program_id_input = check_if_exit(program_id_input)
            
            # Validate if program_id is an integer
            program_id = int(program_id_input)
            
            # Validate if program exists in the database
            result = supabase.table('programs').select('id, program_name').eq('id', program_id).execute()
            
            if not result.data:
                print(f"❌ Program with ID {program_id} not found in the database. Please try again.")
                continue
                
            program_name = result.data[0]['program_name']
            print(f"✅ Selected Program: {program_name} (ID: {program_id})")
            return program_id
            
        except ValueError:
            print("❌ Invalid input. Program ID must be an integer.")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

def get_course_code():
    """Ask the user for the course code."""
    while True:
        course_code_input = input("\nEnter the course code (e.g., COSC 1P02): ")
        
        # Check if user wants to exit
        course_code = check_if_exit(course_code_input)
        
        if course_code.strip():
            return course_code.strip()
        print("❌ Course code cannot be empty. Please try again.")

def get_year():
    """Ask the user for the year."""
    while True:
        try:
            year_input = input("\nEnter the year (e.g., 1, 2, 3, 4): ")
            
            # Check if user wants to exit
            year_input = check_if_exit(year_input)
            
            if not year_input.strip():
                print("❌ Year cannot be empty. Please try again.")
                continue
            return int(year_input)
        except ValueError:
            print("❌ Invalid input. Year must be an integer.")

def get_requirement_type():
    """Ask the user for the requirement type."""
    print("\nRequirement Type Options:")
    print("1 = Required")
    print("2 = Elective")
    print("3 = Context")
    
    while True:
        try:
            req_type_input = input("\nSelect requirement type (1, 2, or 3): ")
            
            # Check if user wants to exit
            req_type = check_if_exit(req_type_input)
            
            if req_type == "1":
                return "required"
            elif req_type == "2":
                return "elective"
            elif req_type == "3":
                return "context"
            else:
                print("❌ Invalid option. Please enter 1, 2, or 3.")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

def get_min_grade():
    """Ask the user for the optional min_grade."""
    while True:
        try:
            min_grade_input = input("\nIs there a minimum grade requirement? (Leave blank if none, or enter an integer value): ")
            
            # Check if user wants to exit
            min_grade_input = check_if_exit(min_grade_input)
            
            if not min_grade_input.strip():
                return None
            return int(min_grade_input)
        except ValueError:
            print("❌ Invalid input. Min grade must be an integer or left blank.")

def add_program_requirement(program_id):
    """Add a program requirement to the database."""
    course_code = get_course_code()
    year = get_year()
    requirement_type = get_requirement_type()
    min_grade = get_min_grade()
    
    # Default credit weight is 0.5 as shown in the UI
    credit_weight = 0.5
    
    # Current timestamp
    now = datetime.now().isoformat()
    
    # Prepare data for insertion
    data = {
        'program_id': program_id,
        'year': year,
        'course_code': course_code,
        'credit_weight': credit_weight,
        'requirement_type': requirement_type,
        'created_at': now,
        'updated_at': now
    }
    
    # Add min_grade if provided
    if min_grade is not None:
        data['min_grade'] = min_grade
    
    try:
        result = supabase.table('program_requirements').insert(data).execute()
        
        if result.data:
            print(f"\n✅ Successfully added {course_code} as a {requirement_type} requirement for year {year}!")
            return True
        else:
            print("\n❌ Failed to add program requirement. No error returned but no data inserted.")
            return False
    except Exception as e:
        print(f"\n❌ Error adding program requirement: {str(e)}")
        return False

def display_existing_requirements(program_id):
    """Display existing course requirements for the selected program."""
    try:
        # Fetch program name
        program_result = supabase.table('programs').select('program_name').eq('id', program_id).execute()
        if not program_result.data:
            print(f"❌ Program with ID {program_id} not found.")
            return
            
        program_name = program_result.data[0]['program_name']
        
        # Fetch all requirements for this program
        result = supabase.table('program_requirements').select('*').eq('program_id', program_id).order('year,course_code').execute()
        
        if not result.data:
            print(f"\n📚 No existing course requirements found for {program_name}.")
            return
        
        print(f"\n📚 Existing Course Requirements for {program_name}:")
        print("-" * 80)
        print(f"{'YEAR':<5} | {'COURSE CODE':<15} | {'TYPE':<10} | {'CREDIT':<8} | {'MIN GRADE':<10}")
        print("-" * 80)
        
        for req in result.data:
            year = req.get('year', 'N/A')
            course_code = req.get('course_code', 'N/A')
            req_type = req.get('requirement_type', 'N/A')
            credit = req.get('credit_weight', 'N/A')
            
            # Fix: Convert None to a dash string for min_grade instead of using get with default
            min_grade = req.get('min_grade')
            min_grade_str = str(min_grade) if min_grade is not None else '-'
            
            print(f"{year:<5} | {course_code:<15} | {req_type:<10} | {credit:<8} | {min_grade_str:<10}")
        
        print("-" * 80)
        print(f"Total: {len(result.data)} course requirements")
    except Exception as e:
        print(f"❌ Error fetching program requirements: {str(e)}")
        print(f"Debug info - result data: {result.data if 'result' in locals() and hasattr(result, 'data') else 'No data'}")

def main():
    """Main function to run the program."""
    print("\n🎓 Program Requirements Adder 🎓")
    print("=" * 40)
    print("This script helps you add course requirements to programs in the database.")
    print(f"You can type {', '.join(EXIT_KEYWORDS)} at any prompt to exit the program.")
    
    # Get program ID once
    program_id = get_program_id()
    
    # Display existing requirements for the selected program
    display_existing_requirements(program_id)
    
    # Keep adding requirements until user exits
    print(f"\nContinuously adding requirements to program (ID: {program_id}).")
    print(f"Type any of {', '.join(EXIT_KEYWORDS)} at any prompt to exit the program.")
    
    while True:
        # Add a requirement
        add_program_requirement(program_id)
        
        # Show updated requirements
        display_existing_requirements(program_id)
        
        print(f"\nReady for next requirement. Type any of {', '.join(EXIT_KEYWORDS)} to exit.")
    
    # Note: We never reach here normally as the program will exit via check_if_exit function

if __name__ == "__main__":
    main()
