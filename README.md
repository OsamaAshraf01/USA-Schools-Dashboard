# USA Public Schools Dashboard

## Getting Started

This guide will help you set up and explore the USA Public Schools Dashboard. The dashboard is designed to provide an in-depth analysis of the American public education system for the academic year 2014-2015. It utilizes robust data visualization techniques to deliver insights into various educational metrics.

### Prerequisites

- Python 3.8 or higher
- Required Python libraries:
  - Flask
  - Pandas
  - SQLAlchemy

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/usa-public-schools-dashboard.git
   cd usa-public-schools-dashboard
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Ensure the `usa_schools.csv` file is present in the project directory.

### Running the Application

1. Initialize the database and start the server:
   ```bash
   python server.py
   ```
2. Open your web browser and navigate to `http://127.0.0.1:5000` to access the dashboard.

---

## Project Overview

### Dashboard Summary

The USA Public Schools Dashboard represents a sophisticated educational data visualization system that provides comprehensive insights into the American public education landscape for the 2014-2015 academic year.

Key features include:

- High-level national statistics
- Grade-level distributions
- Interactive visualization methods

The dashboard emphasizes clarity and accessibility, presenting detailed metrics essential for educational analysis.

### Key Metrics Overview

- **Total Schools:** 96,182 institutions
- **Total Students:** 52,887,076
- **Total Teachers:** 2,875,894
- **Average Student-Teacher Ratio:** 17:1

---

## Analysis Highlights

### Geographic Student Distribution

- A choropleth map visualizes student density by state.
- States like Texas and California show higher concentrations of students.

### Education Levels Distribution

- Donut charts provide proportional insights into different education levels.

### Population-Teachers Relation

- A scatter plot demonstrates the correlation between student population and teacher allocation.

### Grade Distribution

- Bar charts reveal trends from nursery through grade 12, showing peaks and declines at different levels.

---

## Future Work

### Technical Enhancements

- Implement interactive filtering and trend analysis.
- Add real-time data updates via API integration.

### Visual and Feature Expansion

- Introduce dark mode and responsive design.
- Enable comparative analysis and performance metrics integration.

### Data Enhancements

- Incorporate private school statistics and historical trends.
- Visualize financial and demographic data for equity analysis.

---

## Author

Developed by Osama Ashraf Abdelwahhab.

---

For detailed insights, refer to the full analysis report included in this repository.
