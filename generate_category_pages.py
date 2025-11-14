"""
Generate Individual Category Pages
===================================
Creates HTML pages for each of the 23 categories with embedded search
"""

import json
import os

BASE_DIR = r"C:\Users\racacer\OneDrive - Emory\claude_onedrive\Projects\SCD articles"
WEBSITE_DIR = os.path.join(BASE_DIR, "website")
DATA_DIR = os.path.join(WEBSITE_DIR, "data")
CATEGORIES_DIR = os.path.join(WEBSITE_DIR, "categories")

# Create categories directory
os.makedirs(CATEGORIES_DIR, exist_ok=True)

# Load data
with open(os.path.join(DATA_DIR, "publications_search.json"), 'r', encoding='utf-8') as f:
    publications = json.load(f)

with open(os.path.join(DATA_DIR, "category_structure.json"), 'r', encoding='utf-8') as f:
    structure = json.load(f)

print("Generating category pages...")

# Category metadata
category_icons = {
    'Cancer': 'fa-dna',
    'Metabolic Diseases': 'fa-heart-pulse',
    'Cardiovascular': 'fa-heartbeat',
    'Neurodegenerative': 'fa-brain',
    'Biological Processes': 'fa-microscope'
}

category_colors = {
    'Cancer': '#dc2626',
    'Metabolic Diseases': '#059669',
    'Cardiovascular': '#dc2626',
    'Neurodegenerative': '#7c3aed',
    'Biological Processes': '#2563eb'
}

# Generate main category pages
for main_cat, subcats in structure.items():
    filename = main_cat.lower().replace(' ', '-').replace('&', 'and') + '.html'
    filepath = os.path.join(CATEGORIES_DIR, filename)

    # Filter publications for this main category
    cat_pubs = [p for p in publications if any(c.startswith(main_cat) for c in p['categories'])]

    # Count by subcategory
    subcat_counts = {}
    for subcat in subcats:
        count = len([p for p in cat_pubs if f"{main_cat}: {subcat}" in p['categories']])
        subcat_counts[subcat] = count

    icon = category_icons.get(main_cat, 'fa-folder')
    color = category_colors.get(main_cat, '#6366f1')

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{main_cat} - SCD Publications Database</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <a href="../index.html" class="back-link">
                    <i class="fas fa-arrow-left"></i> Back to Home
                </a>
                <div class="category-header" style="border-left: 4px solid {color};">
                    <div class="category-icon" style="background: {color}20; color: {color};">
                        <i class="fas {icon}"></i>
                    </div>
                    <div>
                        <h1>{main_cat}</h1>
                        <p class="category-subtitle">{len(cat_pubs)} publications across {len(subcats)} subcategories</p>
                    </div>
                </div>
            </div>
        </header>

        <!-- Search Section -->
        <div class="search-section">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input
                    type="text"
                    id="searchInput"
                    class="search-input"
                    placeholder="Search publications in this category..."
                    autocomplete="off"
                >
                <button onclick="clearSearch()" class="clear-button" id="clearBtn" style="display: none;">
                    <i class="fas fa-times"></i>
                </button>
                <div id="autocomplete-results" class="autocomplete-results"></div>
            </div>

            <!-- Filters -->
            <div class="search-filters">
                <label class="filter-checkbox">
                    <input type="checkbox" id="reviewsOnly">
                    <span>Reviews Only</span>
                </label>
                <label class="filter-checkbox">
                    <input type="checkbox" id="originalOnly">
                    <span>Original Research Only</span>
                </label>
                <select id="subcategoryFilter" class="filter-select">
                    <option value="">All Subcategories</option>
                    {''.join(f'<option value="{sub}">{sub} ({subcat_counts[sub]})</option>' for sub in subcats)}
                </select>
                <select id="yearFilter" class="filter-select">
                    <option value="">All Years</option>
                </select>
            </div>
        </div>

        <!-- Subcategory Summary -->
        <div class="subcategory-summary">
            <h2>Subcategories</h2>
            <div class="subcategory-grid">
                {''.join(f'''
                <div class="subcategory-item" onclick="filterBySubcategory('{sub}')">
                    <h3>{sub}</h3>
                    <p class="paper-count">{subcat_counts[sub]} papers</p>
                </div>
                ''' for sub in subcats)}
            </div>
        </div>

        <!-- Results Section -->
        <div id="results-section" style="display: none;">
            <div id="searchResults"></div>
            <div id="noResults" class="no-results" style="display: none;">
                <i class="fas fa-search"></i>
                <p>No publications found matching your criteria</p>
            </div>
        </div>

        <!-- All Publications -->
        <div id="all-publications">
            <h2>All Publications ({len(cat_pubs)})</h2>
            <div id="publicationList"></div>
        </div>
    </div>

    <!-- Load category-specific data -->
    <script>
        const CATEGORY_FILTER = '{main_cat}';
    </script>
    <script src="../js/search.js"></script>
    <script>
        // Load and display all publications for this category on page load
        async function loadCategoryPublications() {{
            try {{
                const response = await fetch('../data/publications_search.json');
                const allPubs = await response.json();

                // Filter for this category
                const categoryPubs = allPubs.filter(p =>
                    p.categories.some(c => c.startsWith(CATEGORY_FILTER))
                );

                // Sort by year (newest first)
                categoryPubs.sort((a, b) => b.year.localeCompare(a.year));

                // Display all publications
                const listDiv = document.getElementById('publicationList');
                listDiv.innerHTML = categoryPubs.map(pub => renderPaperCard(pub)).join('');

                // Populate year filter
                const years = [...new Set(categoryPubs.map(p => p.year))].sort().reverse();
                const yearFilter = document.getElementById('yearFilter');
                years.forEach(year => {{
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearFilter.appendChild(option);
                }});

                // Store globally for search
                window.categoryPublications = categoryPubs;
            }} catch (error) {{
                console.error('Error loading publications:', error);
            }}
        }}

        // Filter by subcategory when clicked
        function filterBySubcategory(subcategory) {{
            document.getElementById('subcategoryFilter').value = subcategory;
            const event = new Event('change');
            document.getElementById('subcategoryFilter').dispatchEvent(event);
        }}

        // Override search to use category publications
        const originalSearch = searchPublications;
        searchPublications = function(query) {{
            if (!window.categoryPublications) return [];

            if (!query || query.length < 2) return [];

            const queryLower = query.toLowerCase();
            const reviewsOnly = document.getElementById('reviewsOnly').checked;
            const originalOnly = document.getElementById('originalOnly').checked;
            const subcategoryFilter = document.getElementById('subcategoryFilter').value;
            const yearFilter = document.getElementById('yearFilter').value;

            let results = window.categoryPublications.filter(pub => {{
                const matchesText = pub.search_text.includes(queryLower);

                if (reviewsOnly && !pub.is_review) return false;
                if (originalOnly && pub.is_review) return false;

                if (subcategoryFilter && !pub.categories.includes(`${{CATEGORY_FILTER}}: ${{subcategoryFilter}}`)) return false;
                if (yearFilter && pub.year !== yearFilter) return false;

                return matchesText;
            }});

            results.sort((a, b) => {{
                const aTitleMatch = a.title.toLowerCase().includes(queryLower);
                const bTitleMatch = b.title.toLowerCase().includes(queryLower);
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                return b.year.localeCompare(a.year);
            }});

            return results;
        }};

        // Load publications on page load
        document.addEventListener('DOMContentLoaded', () => {{
            loadCategoryPublications();

            // Show clear button when typing
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', (e) => {{
                document.getElementById('clearBtn').style.display = e.target.value ? 'block' : 'none';
            }});
        }});
    </script>
</body>
</html>
"""

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"  [OK] Created {filename} ({len(cat_pubs)} papers)")

print(f"\n[OK] Generated {len(structure)} category pages")
print(f"  Total pages created in: {CATEGORIES_DIR}")
