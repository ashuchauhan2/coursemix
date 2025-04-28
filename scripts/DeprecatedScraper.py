#DO NOT USE THIS FILE!!!!
# import requests
# from bs4 import BeautifulSoup
# import re
# from collections import defaultdict

# def clean_course_code(course_code):
#     """Remove any non-alphabetic prefixes from course codes."""
#     match = re.search(r'[A-Za-z]', course_code)
#     if match:
#         return course_code[match.start():].strip()
#     return course_code.strip()

# def count_courses(urls):
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36"
#     }
    
#     total_courses = 0
#     department_counts = defaultdict(int)
    
#     try:
#         for url in urls:
#             department = url.split('/')[-1].split('.')[0].upper()
#             print(f"\nCounting courses from department: {department}")
            
#             page = requests.get(url, headers=headers)
#             page.raise_for_status()
#             soup = BeautifulSoup(page.text, 'html.parser')
            
#             course_elements = soup.find_all('p', {'class': 'calccode'})
#             course_count = len(course_elements)
            
#             department_counts[department] = course_count
#             total_courses += course_count
            
#             print(f"Found {course_count} courses in {department}")
            
#         # Print summary
#         print("\n" + "="*50)
#         print("Course Count Summary")
#         print("="*50)
        
#         # Sort departments by count in descending order
#         sorted_departments = sorted(department_counts.items(), key=lambda x: x[1], reverse=True)
        
#         for dept, count in sorted_departments:
#             print(f"{dept}: {count} courses")
            
#         print("\n" + "="*50)
#         print(f"Total number of courses across all departments: {total_courses}")
#         print("="*50)
            
#     except requests.RequestException as e:
#         print(f"Error fetching the webpage: {e}")
#     except Exception as e:
#         print(f"An error occurred: {e}")
        
#     return total_courses

# if __name__ == "__main__":
#     # List of URLs to scrape (same as your original list)
#     urls_to_scrape = [
#         "https://brocku.ca/webcal/2024/undergrad/cosc.html",
#         # ... (rest of your URLs)
#     ]
    
#     count_courses(urls_to_scrape)