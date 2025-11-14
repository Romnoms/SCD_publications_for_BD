// Main page category display
async function loadCategories() {
    try {
        const response = await fetch('data/category_structure.json');
        const structure = await response.json();

        const publicationsResponse = await fetch('data/publications_search.json');
        const publications = await response.json();

        displayCategories(structure, publications);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display category cards
function displayCategories(structure, publications) {
    const grid = document.getElementById('category-grid');

    const categoryOrder = [
        'Cancer',
        'Metabolic Diseases',
        'Cardiovascular',
        'Neurodegenerative',
        'Biological Processes'
    ];

    const categoryIcons = {
        'Cancer': 'fa-dna',
        'Metabolic Diseases': 'fa-heart-pulse',
        'Cardiovascular': 'fa-heartbeat',
        'Neurodegenerative': 'fa-brain',
        'Biological Processes': 'fa-microscope'
    };

    const categoryColors = {
        'Cancer': '#dc2626',
        'Metabolic Diseases': '#059669',
        'Cardiovascular': '#dc2626',
        'Neurodegenerative': '#7c3aed',
        'Biological Processes': '#2563eb'
    };

    categoryOrder.forEach(mainCat => {
        if (structure[mainCat]) {
            const subcats = structure[mainCat];
            const icon = categoryIcons[mainCat] || 'fa-folder';
            const color = categoryColors[mainCat] || 'var(--primary-color)';

            // Count papers in this main category
            const count = publications.filter(p =>
                p.categories.some(c => c.startsWith(mainCat))
            ).length;

            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-icon" style="background: ${color}20; color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <h3>${mainCat}</h3>
                <p class="category-count">${count} publications</p>
                <div class="subcategory-list">
                    ${subcats.slice(0, 3).map(sub => `<span>${sub}</span>`).join('')}
                    ${subcats.length > 3 ? `<span>+${subcats.length - 3} more</span>` : ''}
                </div>
                <a href="categories/${mainCat.toLowerCase().replace(/\s+/g, '-')}.html" class="view-category">
                    Browse Category <i class="fas fa-arrow-right"></i>
                </a>
            `;

            grid.appendChild(card);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});
