// Search and Autocomplete Functionality
let publicationsData = [];
let autocompleteTimeout = null;

// Load publications data
async function loadPublications() {
    try {
        const response = await fetch('data/publications_search.json');
        publicationsData = await response.json();
        console.log(`Loaded ${publicationsData.length} publications`);
        updateStatistics();
        populateFilters();
    } catch (error) {
        console.error('Error loading publications:', error);
    }
}

// Update statistics
function updateStatistics() {
    const reviewCount = publicationsData.filter(p => p.is_review).length;
    document.getElementById('reviewCount').textContent = reviewCount;
    document.getElementById('researchCount').textContent = publicationsData.length - reviewCount;
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique categories
    const categories = new Set();
    publicationsData.forEach(pub => {
        pub.categories.forEach(cat => categories.add(cat));
    });

    const categoryFilter = document.getElementById('categoryFilter');
    Array.from(categories).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Get unique years
    const years = new Set();
    publicationsData.forEach(pub => {
        if (pub.year) years.add(pub.year);
    });

    const yearFilter = document.getElementById('yearFilter');
    Array.from(years).sort().reverse().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Search functionality
function searchPublications(query) {
    if (!query || query.length < 2) {
        return [];
    }

    const queryLower = query.toLowerCase();
    const reviewsOnly = document.getElementById('reviewsOnly').checked;
    const originalOnly = document.getElementById('originalOnly').checked;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;

    let results = publicationsData.filter(pub => {
        // Text search
        const matchesText = pub.search_text.includes(queryLower);

        // Filter by review status
        if (reviewsOnly && !pub.is_review) return false;
        if (originalOnly && pub.is_review) return false;

        // Filter by category
        if (categoryFilter && !pub.categories.includes(categoryFilter)) return false;

        // Filter by year
        if (yearFilter && pub.year !== yearFilter) return false;

        return matchesText;
    });

    // Sort by relevance (title matches first, then others)
    results.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(queryLower);
        const bTitleMatch = b.title.toLowerCase().includes(queryLower);

        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        // Then by year (newest first)
        return b.year.localeCompare(a.year);
    });

    return results;
}

// Autocomplete functionality
function showAutocomplete(query) {
    const resultsDiv = document.getElementById('autocomplete-results');

    if (!query || query.length < 2) {
        resultsDiv.classList.remove('show');
        return;
    }

    const results = searchPublications(query).slice(0, 10); // Show top 10 results

    if (results.length === 0) {
        resultsDiv.classList.remove('show');
        return;
    }

    resultsDiv.innerHTML = results.map(pub => `
        <div class="autocomplete-item" onclick="selectPaper('${pub.pmid}')">
            <div class="paper-title">
                ${pub.title}
                ${pub.is_review ? '<span class="review-badge">REVIEW</span>' : ''}
            </div>
            <div class="paper-meta">
                ${pub.first_author} et al. | ${pub.journal} (${pub.year}) | PMID: ${pub.pmid}
            </div>
        </div>
    `).join('');

    resultsDiv.classList.add('show');
}

// Select paper from autocomplete
function selectPaper(pmid) {
    const paper = publicationsData.find(p => p.pmid === pmid);
    if (paper) {
        displaySearchResults([paper]);
        document.getElementById('searchInput').value = paper.title;
        document.getElementById('autocomplete-results').classList.remove('show');
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsSection = document.getElementById('results-section');
    const categoriesSection = document.getElementById('categories-section');
    const resultsDiv = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');

    categoriesSection.style.display = 'none';
    resultsSection.style.display = 'block';

    if (results.length === 0) {
        resultsDiv.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    resultsDiv.innerHTML = `
        <p style="margin-bottom: 1.5rem; color: var(--text-light);">
            Found ${results.length} paper${results.length === 1 ? '' : 's'}
        </p>
        ${results.map(pub => renderPaperCard(pub)).join('')}
    `;
}

// Render paper card
function renderPaperCard(pub) {
    const scd1Rel = extractSCD1Relationship(pub);

    return `
        <div class="paper-card">
            <div class="paper-title">
                ${pub.title}
                ${pub.is_review ? '<span class="review-tag">REVIEW</span>' : ''}
            </div>

            <div class="paper-meta">
                <span><i class="fas fa-user"></i> ${pub.authors.slice(0, 3).join(', ')}${pub.authors.length > 3 ? ' et al.' : ''}</span>
                <span><i class="fas fa-book"></i> ${pub.journal}</span>
                <span><i class="fas fa-calendar"></i> ${pub.year}</span>
                <span><i class="fas fa-tag"></i> PMID: ${pub.pmid}</span>
            </div>

            <div class="paper-links">
                <a href="https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/" target="_blank" class="paper-link">
                    <i class="fas fa-external-link-alt"></i> PubMed
                </a>
                ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" class="paper-link">
                    <i class="fas fa-file-alt"></i> DOI
                </a>` : ''}
                ${pub.pmc ? `<a href="https://www.ncbi.nlm.nih.gov/pmc/articles/${pub.pmc}/" target="_blank" class="paper-link">
                    <i class="fas fa-unlock"></i> PMC
                </a>` : ''}
            </div>

            ${pub.keywords && pub.keywords.length > 0 ? `
                <div style="margin: 0.75rem 0;">
                    <strong>Keywords:</strong> ${pub.keywords.slice(0, 8).join(', ')}
                </div>
            ` : ''}

            <div class="paper-abstract">
                <strong>Abstract:</strong><br>
                ${pub.abstract || 'No abstract available'}
            </div>

            <div class="scd1-relationship">
                <strong>How it relates to SCD1:</strong><br>
                ${scd1Rel}
            </div>

            <div style="margin-top: 1rem; color: var(--text-light); font-size: 0.9rem;">
                <strong>Categories:</strong> ${pub.categories.join(', ')}
            </div>
        </div>
    `;
}

// Extract SCD1 relationship
function extractSCD1Relationship(pub) {
    const text = `${pub.title} ${pub.abstract}`.toLowerCase();
    const relationships = [];

    // Direct SCD/FADS mentions
    if (text.includes('scd1') || text.includes('stearoyl-coa desaturase')) {
        if (text.includes('inhibit')) relationships.push('Studies SCD1 inhibition');
        else if (text.includes('express')) relationships.push('Examines SCD1 expression');
        else if (text.includes('regulat')) relationships.push('Investigates SCD1 regulation');
        else relationships.push('Investigates SCD1');
    }

    if (text.includes('fads')) {
        relationships.push('Studies fatty acid desaturases (FADS)');
    }

    // Metabolic pathways
    if (text.includes('lipid metabolism') || text.includes('fatty acid metabolism')) {
        relationships.push('Studies lipid/fatty acid metabolism pathways involving SCD');
    }

    if (text.includes('ferroptosis')) {
        relationships.push('Links SCD1/FADS to ferroptosis regulation');
    }

    if (text.includes('angiogenesis')) {
        relationships.push('Connects lipid metabolism to angiogenesis');
    }

    if (relationships.length === 0) {
        return 'Studies lipid metabolism pathways relevant to SCD1/FADS function';
    }

    return relationships.slice(0, 3).join('; ');
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('reviewsOnly').checked = false;
    document.getElementById('originalOnly').checked = false;
    document.getElementById('categoryFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('autocomplete-results').classList.remove('show');
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('categories-section').style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPublications();

    const searchInput = document.getElementById('searchInput');

    // Autocomplete on input
    searchInput.addEventListener('input', (e) => {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            showAutocomplete(e.target.value);
        }, 300);
    });

    // Search on Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const results = searchPublications(e.target.value);
            displaySearchResults(results);
            document.getElementById('autocomplete-results').classList.remove('show');
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('autocomplete-results').classList.remove('show');
        }
    });

    // Filter changes trigger search
    document.querySelectorAll('.search-filters input, .search-filters select').forEach(el => {
        el.addEventListener('change', () => {
            const query = searchInput.value;
            if (query && query.length >= 2) {
                const results = searchPublications(query);
                displaySearchResults(results);
            }
        });
    });
});
