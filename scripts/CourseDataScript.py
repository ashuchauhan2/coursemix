import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from supabase import create_client
import re
import os
from dotenv import load_dotenv
import sys

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
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}")
    sys.exit(1)

def extract_program_code(url):
    return url.split('/')[-1].replace('.html', '').upper()

def get_and_insert_course_info(program_code):
    url = "https://brocku.ca/guides-and-timetables/wp-content/plugins/brocku-plugin-course-tables/ajax.php"
    data = {
        "action": "get_programcourses",
        "session": "FW",
        "type": "UG",
        "level": "All",
        "program": program_code,
        "onlineonly": ''
    }
    
    try:
        response = requests.post(url, data=data)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all course rows
        course_rows = soup.find_all('tr', class_='course-row')
        
        inserted_count = 0
        for row in course_rows:
            # Only process main course entries (lectures)
            if row.get('data-main_flag') == '1':
                try:
                    # Convert Unix timestamps to dates
                    start_date = datetime.fromtimestamp(int(row.get('data-startdate'))).strftime('%Y-%m-%d')
                    end_date = datetime.fromtimestamp(int(row.get('data-enddate'))).strftime('%Y-%m-%d')
                    
                    # Prepare course data
                    course_data = {
                        'course_code': row.get('data-cc'),
                        'course_duration': int(row.get('data-duration')),
                        'course_days': row.get('data-days').strip(),
                        'class_time': row.get('data-class_time'),
                        'class_type': row.get('data-class_type'),
                        'instructor': row.get('data-instructor', 'Not specified'),
                        'start_date': start_date,
                        'end_date': end_date
                    }
                    
                    # Insert data into Supabase
                    response = supabase.table('courses').insert(course_data).execute()
                    inserted_count += 1
                    
                except Exception as e:
                    print(f"Error processing course in {program_code}: {str(e)}")
                    continue
        
        print(f"Successfully inserted {inserted_count} courses for {program_code}")
        
    except Exception as e:
        print(f"Error fetching data for {program_code}: {str(e)}")

def main():
    # List of URLs
    urls = [
        "https://brocku.ca/webcal/2024/undergrad/cosc.html",
        "https://brocku.ca/webcal/2024/undergrad/math.html",
        "https://brocku.ca/webcal/2024/undergrad/abed.html",
        "https://brocku.ca/webcal/2024/undergrad/abte.html",
        "https://brocku.ca/webcal/2024/undergrad/accc.html",
        "https://brocku.ca/webcal/2024/undergrad/actg.html",
        "https://brocku.ca/webcal/2024/undergrad/aded.html",
        "https://brocku.ca/webcal/2024/undergrad/admi.html",
        "https://brocku.ca/webcal/2024/undergrad/adst.html",
        "https://brocku.ca/webcal/2024/undergrad/apco.html",
        "https://brocku.ca/webcal/2024/undergrad/astr.html",
        "https://brocku.ca/webcal/2024/undergrad/bchm.html",
        "https://brocku.ca/webcal/2024/undergrad/biol.html",
        "https://brocku.ca/webcal/2024/undergrad/bmed.html",
        "https://brocku.ca/webcal/2024/undergrad/bost.html",
        "https://brocku.ca/webcal/2024/undergrad/bphy.html",
        "https://brocku.ca/webcal/2024/undergrad/brdg.html",
        "https://brocku.ca/webcal/2024/undergrad/btec.html",
        "https://brocku.ca/webcal/2024/undergrad/btgd.html",
        "https://brocku.ca/webcal/2024/undergrad/cana.html",
        "https://brocku.ca/webcal/2024/undergrad/chem.html",
        "https://brocku.ca/webcal/2024/undergrad/chys.html",
        "https://brocku.ca/webcal/2024/undergrad/clas.html",
        "https://brocku.ca/webcal/2024/undergrad/comm.html",
        "https://brocku.ca/webcal/2024/undergrad/cpcf.html",
        "https://brocku.ca/webcal/2024/undergrad/crim.html",
        "https://brocku.ca/webcal/2024/undergrad/dart.html",
        "https://brocku.ca/webcal/2024/undergrad/dasa.html",
        "https://brocku.ca/webcal/2024/undergrad/ecec.html",
        "https://brocku.ca/webcal/2024/undergrad/econ.html",
        "https://brocku.ca/webcal/2024/undergrad/edbe.html",
        "https://brocku.ca/webcal/2024/undergrad/educ.html",
        "https://brocku.ca/webcal/2024/undergrad/encw.html",
        "https://brocku.ca/webcal/2024/undergrad/engl.html",
        "https://brocku.ca/webcal/2024/undergrad/engr.html",
        "https://brocku.ca/webcal/2024/undergrad/engs.html",
        "https://brocku.ca/webcal/2024/undergrad/ensu.html",
        "https://brocku.ca/webcal/2024/undergrad/entr.html",
        "https://brocku.ca/webcal/2024/undergrad/ersc.html",
        "https://brocku.ca/webcal/2024/undergrad/ethc.html",
        "https://brocku.ca/webcal/2024/undergrad/film.html",
        "https://brocku.ca/webcal/2024/undergrad/flic.html",
        "https://brocku.ca/webcal/2024/undergrad/fmsc.html",
        "https://brocku.ca/webcal/2024/undergrad/fnce.html",
        "https://brocku.ca/webcal/2024/undergrad/fpac.html",
        "https://brocku.ca/webcal/2024/undergrad/fren.html",
        "https://brocku.ca/webcal/2024/undergrad/geog.html",
        "https://brocku.ca/webcal/2024/undergrad/germ.html",
        "https://brocku.ca/webcal/2024/undergrad/gree.html",
        "https://brocku.ca/webcal/2024/undergrad/hist.html",
        "https://brocku.ca/webcal/2024/undergrad/hlsc.html",
        "https://brocku.ca/webcal/2024/undergrad/huma.html",
        "https://brocku.ca/webcal/2024/undergrad/humc.html",
        "https://brocku.ca/webcal/2024/undergrad/iasc.html",
        "https://brocku.ca/webcal/2024/undergrad/indg.html",
        "https://brocku.ca/webcal/2024/undergrad/ital.html",
        "https://brocku.ca/webcal/2024/undergrad/itis.html",
        "https://brocku.ca/webcal/2024/undergrad/kine.html",
        "https://brocku.ca/webcal/2024/undergrad/labr.html",
        "https://brocku.ca/webcal/2024/undergrad/lati.html",
        "https://brocku.ca/webcal/2024/undergrad/lawp.html",
        "https://brocku.ca/webcal/2024/undergrad/lcbe.html",
        "https://brocku.ca/webcal/2024/undergrad/ling.html",
        "https://brocku.ca/webcal/2024/undergrad/mars.html",
        "https://brocku.ca/webcal/2024/undergrad/medp.html",
        "https://brocku.ca/webcal/2024/undergrad/mgmt.html",
        "https://brocku.ca/webcal/2024/undergrad/mktg.html",
        "https://brocku.ca/webcal/2024/undergrad/mllc.html",
        "https://brocku.ca/webcal/2024/undergrad/musi.html",
        "https://brocku.ca/webcal/2024/undergrad/neur.html",
        "https://brocku.ca/webcal/2024/undergrad/nurs.html",
        "https://brocku.ca/webcal/2024/undergrad/nusc.html",
        "https://brocku.ca/webcal/2024/undergrad/obhr.html",
        "https://brocku.ca/webcal/2024/undergrad/oevi.html",
        "https://brocku.ca/webcal/2024/undergrad/oper.html",
        "https://brocku.ca/webcal/2024/undergrad/pcul.html",
        "https://brocku.ca/webcal/2024/undergrad/phil.html",
        "https://brocku.ca/webcal/2024/undergrad/phys.html",
        "https://brocku.ca/webcal/2024/undergrad/pmpb.html",
        "https://brocku.ca/webcal/2024/undergrad/poli.html",
        "https://brocku.ca/webcal/2024/undergrad/psyc.html",
        "https://brocku.ca/webcal/2024/undergrad/recl.html",
        "https://brocku.ca/webcal/2024/undergrad/scie.html",
        "https://brocku.ca/webcal/2024/undergrad/scis.html",
        "https://brocku.ca/webcal/2024/undergrad/soci.html",
        "https://brocku.ca/webcal/2024/undergrad/sosc.html",
        "https://brocku.ca/webcal/2024/undergrad/span.html",
        "https://brocku.ca/webcal/2024/undergrad/spma.html",
        "https://brocku.ca/webcal/2024/undergrad/stac.html",
        "https://brocku.ca/webcal/2024/undergrad/stat.html",
        "https://brocku.ca/webcal/2024/undergrad/step.html",
        "https://brocku.ca/webcal/2024/undergrad/tour.html",
        "https://brocku.ca/webcal/2024/undergrad/visa.html",
        "https://brocku.ca/webcal/2024/undergrad/wgst.html",
        "https://brocku.ca/webcal/2024/undergrad/wrds.html",
        "https://brocku.ca/webcal/2024/undergrad/wise.html",
    ]
    
    total_programs = len(urls)
    processed_programs = 0
    
    print(f"Starting to process {total_programs} programs...")
    
    for url in urls:
        program_code = extract_program_code(url)
        print(f"\nProcessing program {processed_programs + 1}/{total_programs}: {program_code}")
        get_and_insert_course_info(program_code)
        processed_programs += 1
        
    print(f"\nFinished processing all {total_programs} programs")

def get_course_info():
    url = "https://brocku.ca/guides-and-timetables/wp-content/plugins/brocku-plugin-course-tables/ajax.php"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*"
    }
    
    data = {
        "action": "get_programcourses",
        "session": "FW",
        "type": "UG",
        "level": "All",
        "program": "APCO",
        "onlineonly": ''
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        if not response.text:
            print("Empty response received")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        courses = []
        # Find all course rows
        course_rows = soup.find_all('tr', class_='course-row')
        
        if not course_rows:
            print("No course rows found in the response")
            print("Response content:", response.text[:200])  # Print first 200 chars of response
            return []
        
        for row in course_rows:
            # Only process main course entries (lectures)
            if row.get('data-main_flag') == '1':
                try:
                    # Convert Unix timestamps to readable dates
                    start_date = datetime.fromtimestamp(int(row.get('data-startdate', 0))).strftime('%B %d, %Y')
                    end_date = datetime.fromtimestamp(int(row.get('data-enddate', 0))).strftime('%B %d, %Y')
                    
                    course_info = {
                        'code': row.get('data-cc'),
                        'duration': row.get('data-duration'),
                        'days': row.get('data-days', '').strip(),
                        'time': row.get('data-class_time'),
                        'type': row.get('data-class_type'),
                        'instructor': row.get('data-instructor', 'Not specified'),
                        'start_date': start_date,
                        'end_date': end_date,
                        'location': row.get('data-location', 'Not specified'),
                        'section': row.get('data-section', 'Not specified')
                    }
                    courses.append(course_info)
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        return courses
        
    except requests.RequestException as e:
        print(f"Error making request: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []

def format_days(days_string):
    if not days_string:
        return "No days specified"
        
    days_map = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday'
    }
    active_days = []
    for day in days_string:
        if day != ' ' and day in days_map:
            active_days.append(days_map[day])
    return ', '.join(active_days) if active_days else "No days specified"

if __name__ == "__main__":
    main()
