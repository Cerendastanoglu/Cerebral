const { ipcRenderer } = require('electron');

class CerebralApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentItem = null;
        this.currentBodyPart = null;
        this.currentCategory = null;
        this.currentSubcategory = null;
        this.currentView = 'grid'; // grid or list
        this.currentFilter = { status: 'all', sort: 'recent', search: '' };
        
        // Define hierarchical subcategories for each main category
        // Simple, flat structure focused on things people actually track
        this.subcategories = {
            intellectual: {
                'books': { name: 'Books', icon: '📚', description: 'Books you\'ve read or want to read' },
                'podcasts': { name: 'Podcasts', icon: '🎙️', description: 'Podcast episodes and series' },
                'courses': { name: 'Courses', icon: '🎓', description: 'Online courses and learning programs' },
                'documentaries': { name: 'Documentaries', icon: '🎞️', description: 'Educational documentaries' },
                'ideas': { name: 'Ideas & Notes', icon: '💡', description: 'Your thoughts and insights' },
                'professional': { 
                    name: 'Professional', 
                    icon: '💼', 
                    description: 'Work and career knowledge',
                    subcategories: {
                        'articles': { name: 'Articles', icon: '📰', description: 'Industry articles and insights' },
                        'projects': { name: 'Projects', icon: '🚀', description: 'Work projects and initiatives' },
                        'skills': { name: 'Skills', icon: '🛠️', description: 'Skills you\'re learning' },
                        'tools': { name: 'Tools', icon: '⚙️', description: 'Useful tools and software' },
                        'contacts': { name: 'Contacts', icon: '🤝', description: 'Professional connections' },
                        'resources': { name: 'Resources', icon: '📋', description: 'Helpful resources and references' }
                    }
                }
            },
            emotional: {
                'movies': { name: 'Movies', icon: '🎬', description: 'Films you\'ve watched or want to watch' },
                'shows': { name: 'TV Shows', icon: '📺', description: 'TV series and web series' },
                'music': { name: 'Music', icon: '🎵', description: 'Albums, songs, and artists' },
                'art': { name: 'Art', icon: '🎨', description: 'Artwork, galleries, and exhibitions' },
                'games': { name: 'Games', icon: '🎮', description: 'Video games and board games' },
                'journal': { name: 'Journal', icon: '📔', description: 'Your personal thoughts and feelings' }
            },
            physical: {
                'restaurants': { name: 'Restaurants', icon: '🍽️', description: 'Restaurants and cafes to try' },
                'recipes': { name: 'Recipes', icon: '🍳', description: 'Recipes you want to make' },
                'places': { name: 'Places', icon: '🗺️', description: 'Places you want to visit' },
                'activities': { name: 'Activities', icon: '⚡', description: 'Things you want to do' },
                'shopping': { name: 'Shopping', icon: '🛍️', description: 'Things you want to buy' },
                'fitness': { name: 'Fitness', icon: '💪', description: 'Workouts and fitness goals' }
            },
            beyond: {
                'meditation': { name: 'Meditation', icon: '🧘', description: 'Meditation sessions and practices' },
                'philosophy': { name: 'Philosophy', icon: '🤔', description: 'Philosophical ideas and quotes' },
                'spirituality': { name: 'Spirituality', icon: '🌟', description: 'Spiritual teachings and practices' },
                'dreams': { name: 'Dreams', icon: '💭', description: 'Dream journal and insights' },
                'gratitude': { name: 'Gratitude', icon: '🙏', description: 'Things you\'re grateful for' },
                'wisdom': { name: 'Wisdom', icon: '✨', description: 'Life lessons and insights' }
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('toggle-sidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Sidebar close
        document.getElementById('close-sidebar').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Open sidebar
        document.getElementById('open-sidebar').addEventListener('click', () => {
            this.openSidebar();
        });

        // Overlay click to close sidebar
        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Navigation buttons
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
        
        // Smart search input
        const smartSearchInput = document.getElementById('smart-search-input');
        if (smartSearchInput) {
            let searchTimeout;
            smartSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSmartSearch(e.target.value);
                }, 300);
            });
        }
        
        // Category search
        const categorySearch = document.getElementById('category-search');
        if (categorySearch) {
            categorySearch.addEventListener('input', (e) => {
                this.currentFilter.search = e.target.value;
                this.refreshCategoryView();
            });
        }
        
        // Filter controls
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter.status = e.target.value;
                this.refreshCategoryView();
            });
        }
        
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilter.sort = e.target.value;
                this.refreshCategoryView();
            });
        }
        
        // View toggle
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.currentView = view;
                viewBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const container = document.getElementById('category-items-container');
                if (container) {
                    container.classList.toggle('grid-view', view === 'grid');
                    container.classList.toggle('list-view', view === 'list');
                }
            });
        });
        
        // Star rating
        document.addEventListener('click', (e) => {
            if (e.target.closest('.star-rating i')) {
                const star = e.target.closest('.star-rating i');
                const rating = star.dataset.rating;
                const stars = star.parentElement.querySelectorAll('i');
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'active');
                    } else {
                        s.classList.remove('fas', 'active');
                        s.classList.add('far');
                    }
                });
                document.getElementById('item-rating').value = rating;
            }
        });
        
        // Close subcategory panel
        const closePanelBtn = document.getElementById('close-subcategory-panel');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                const panel = document.getElementById('subcategory-detail-panel');
                if (panel) {
                    panel.classList.add('hidden');
                }
            });
        }
        
        // View subcategory dashboard
        const viewDashboardBtn = document.getElementById('view-subcategory-dashboard');
        if (viewDashboardBtn) {
            viewDashboardBtn.addEventListener('click', () => {
                if (this.currentSubcategory) {
                    // Close the panel
                    const panel = document.getElementById('subcategory-detail-panel');
                    if (panel) panel.classList.add('hidden');
                    
                    // Navigate to the items view with this subcategory loaded
                    this.showSubcategoryDashboard(this.currentSubcategory);
                }
            });
        }
        
        // Add new item
        const addNewItemBtn = document.getElementById('add-new-item');
        if (addNewItemBtn) {
            addNewItemBtn.addEventListener('click', () => {
                // Close the panel
                const panel = document.getElementById('subcategory-detail-panel');
                if (panel) panel.classList.add('hidden');
                
                // Navigate to note-taking section with the subcategory pre-selected
                this.showSection('note-taking');
                
                // Pre-fill the subcategory if possible
                const categorySelect = document.getElementById('item-category');
                if (categorySelect && this.currentSubcategory) {
                    categorySelect.value = this.currentSubcategory;
                }
            });
        }

        // Back to body button
        document.getElementById('back-to-body-btn').addEventListener('click', () => {
            this.showMainBody();
        });

        // Add item buttons
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('add-category-item-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        // Modal events
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-save').addEventListener('click', () => {
            this.saveItem();
        });

        // Global search
        document.getElementById('global-search').addEventListener('input', (e) => {
            this.performGlobalSearch(e.target.value);
        });
    }

    initCanvas() {
        this.canvas = document.getElementById('body-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2D context!');
            return;
        }
        
        console.log('Canvas initialized:', this.canvas.width, 'x', this.canvas.height);
        
        // Test canvas with a simple rectangle
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBody();
    }

    drawBody() {
        if (!this.ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw body outline
        this.drawBodyOutline();
        
        // Draw organic pointers
        this.drawOrganicPointers();
        
        this.ctx.restore();
        
        console.log('Body drawn successfully');
    }

    drawBodyOutline() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 4;
        this.ctx.fillStyle = 'transparent';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        this.ctx.shadowBlur = 15;
        
        // Head
        this.ctx.beginPath();
        this.ctx.ellipse(200, 80, 36, 44, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Neck
        this.ctx.beginPath();
        this.ctx.rect(180, 120, 40, 30);
        this.ctx.stroke();
        
        // Upper Torso
        this.ctx.beginPath();
        this.ctx.ellipse(200, 200, 70, 50, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Waist
        this.ctx.beginPath();
        this.ctx.rect(160, 240, 80, 40);
        this.ctx.stroke();
        
        // Lower Torso/Hips
        this.ctx.beginPath();
        this.ctx.ellipse(200, 320, 60, 40, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Left Arm
        this.ctx.beginPath();
        this.ctx.ellipse(120, 180, 24, 50, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(90, 240, 20, 40, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(70, 290, 16, 24, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Right Arm
        this.ctx.beginPath();
        this.ctx.ellipse(280, 180, 24, 50, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(310, 240, 20, 40, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(330, 290, 16, 24, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Left Leg
        this.ctx.beginPath();
        this.ctx.ellipse(170, 400, 20, 70, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(170, 500, 16, 60, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(170, 580, 24, 30, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Right Leg
        this.ctx.beginPath();
        this.ctx.ellipse(230, 400, 20, 70, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(230, 500, 16, 60, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(230, 580, 24, 30, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Joints - make them glow brighter
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        this.ctx.shadowBlur = 20;
        
        const joints = [
            {x: 200, y: 150}, // neck
            {x: 140, y: 180}, {x: 260, y: 180}, // shoulders
            {x: 100, y: 240}, {x: 300, y: 240}, // elbows
            {x: 80, y: 290}, {x: 320, y: 290}, // wrists
            {x: 170, y: 360}, {x: 230, y: 360}, // hips
            {x: 170, y: 460}, {x: 230, y: 460}, // knees
            {x: 170, y: 560}, {x: 230, y: 560}  // ankles
        ];
        
        joints.forEach(joint => {
            this.ctx.beginPath();
            this.ctx.arc(joint.x, joint.y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    drawOrganicPointers() {
        // Head pointer (Intellectual)
        this.drawSluggishPointer(200, 80, 350, 50, '#10b981');
        
        // Heart pointer (Emotional)
        this.drawSluggishPointer(200, 200, 350, 150, '#ec4899');
        
        // Crotch pointer (Physical)
        this.drawSluggishPointer(200, 320, 350, 250, '#f59e0b');
        
        // Above & Beyond (floating above head)
        this.drawSluggishPointer(200, 80, 200, 20, '#8b5cf6');
    }

    drawSluggishPointer(startX, startY, endX, endY, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8;
        
        // Create organic, sluggish curve
        const controlPoints = this.generateOrganicCurve(startX, startY, endX, endY);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        for (let i = 0; i < controlPoints.length - 1; i++) {
            const cp1 = controlPoints[i];
            const cp2 = controlPoints[i + 1];
            this.ctx.quadraticCurveTo(cp1.x, cp1.y, cp2.x, cp2.y);
        }
        
        this.ctx.stroke();
        
        // Add glowing arrowhead
        const lastPoint = controlPoints[controlPoints.length - 1];
        const secondLastPoint = controlPoints[controlPoints.length - 2];
        const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
        
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(
            lastPoint.x - 20 * Math.cos(angle - Math.PI / 6),
            lastPoint.y - 20 * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            lastPoint.x - 20 * Math.cos(angle + Math.PI / 6),
            lastPoint.y - 20 * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    generateOrganicCurve(startX, startY, endX, endY) {
        const points = [];
        const segments = 8;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // Add organic wobble
            const wobbleX = Math.sin(t * Math.PI * 3) * 20;
            const wobbleY = Math.cos(t * Math.PI * 2) * 15;
            
            const x = startX + (endX - startX) * t + wobbleX;
            const y = startY + (endY - startY) * t + wobbleY;
            
            points.push({x, y});
        }
        
        return points;
    }

    setupCanvasPanning() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const deltaX = e.clientX - this.lastPanX;
                const deltaY = e.clientY - this.lastPanY;
                
                this.panX += deltaX;
                this.panY += deltaY;
                
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
                
                this.drawBody();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isPanning = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanning = false;
        });
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.drawBody();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.5);
        this.drawBody();
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.drawBody();
    }

    showMainBody() {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show main body section
        document.getElementById('main-body-section').classList.add('active');
        this.currentSection = 'main-body';
        this.currentCategory = null;
    }

    openCategoryDetail(category) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show category detail section
        document.getElementById('category-detail-section').classList.add('active');
        this.currentSection = 'category-detail';
        this.currentCategory = category;
        this.currentSubcategory = null;

        // Update UI
        document.getElementById('category-title').textContent = this.getCategoryInfo(category).name;
        document.getElementById('category-description').textContent = this.getCategoryInfo(category).description;
        
        // Show subcategories
        this.showSubcategories(category);
        
        // Load category data
        this.loadCategoryDetail(category);
    }
    
    showSubcategories(category) {
        const subcategoriesGrid = document.getElementById('subcategories-grid');
        const categoryData = this.subcategories[category] || {};
        
        subcategoriesGrid.innerHTML = Object.entries(categoryData).map(([key, subcategory]) => `
            <div class="subcategory-group">
                <div class="subcategory-header" data-subcategory="${key}">
                    <h4>${subcategory.name}</h4>
                    <p>${subcategory.description}</p>
                    <span class="subcategory-count">0 entries</span>
                </div>
                <div class="subcategory-list" id="subcategory-${key}">
                    ${Object.entries(subcategory.subcategories).map(([subKey, subSubcategory]) => `
                        <div class="subcategory-item" data-sub-subcategory="${subKey}">
                            <span class="subcategory-name">${subSubcategory.name}</span>
                            <span class="subcategory-desc">${subSubcategory.description}</span>
                            <span class="subcategory-count">0 entries</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        // Add event listeners to subcategory headers
        subcategoriesGrid.querySelectorAll('.subcategory-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const subcategory = e.currentTarget.dataset.subcategory;
                this.toggleSubcategoryList(subcategory);
            });
        });
        
        // Add event listeners to subcategory items
        subcategoriesGrid.querySelectorAll('.subcategory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const subSubcategory = e.currentTarget.dataset.subSubcategory;
                const subcategory = e.currentTarget.closest('.subcategory-group').querySelector('.subcategory-header').dataset.subcategory;
                this.openSubSubcategoryDetail(category, subcategory, subSubcategory);
            });
        });
        
        // Load subcategory counts
        this.loadSubcategoryCounts(category);
    }
    
    toggleSubcategoryList(subcategoryKey) {
        const list = document.getElementById(`subcategory-${subcategoryKey}`);
        if (list.style.display === 'none') {
            list.style.display = 'block';
        } else {
            list.style.display = 'none';
        }
    }
    
    openSubSubcategoryDetail(category, subcategory, subSubcategory) {
        this.currentSubcategory = `${subcategory}.${subSubcategory}`;
        
        // Update UI to show sub-subcategory items
        const subcategoryInfo = this.subcategories[category][subcategory];
        const subSubcategoryInfo = subcategoryInfo.subcategories[subSubcategory];
        
        // Store current context for note-taking
        this.currentNoteContext = {
            category: category,
            subcategory: subcategory,
            subSubcategory: subSubcategory,
            name: subSubcategoryInfo.name,
            description: subSubcategoryInfo.description
        };
        
        // Show note-taking section for books
        if (subSubcategory === 'books') {
            this.showNoteTakingSection();
        } else {
            document.getElementById('category-title').textContent = `${this.getCategoryInfo(category).name} - ${subcategoryInfo.name} - ${subSubcategoryInfo.name}`;
            this.loadSubSubcategoryItems(category, subcategory, subSubcategory);
        }
    }
    
    showNoteTakingSection() {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show note-taking section
        document.getElementById('note-taking-section').classList.add('active');
        
        // Update note-taking header
        document.getElementById('note-category-title').textContent = `Add New Book`;
        document.getElementById('note-category-description').textContent = `Track your reading progress and thoughts`;
        
        // Load recent books
        this.loadRecentBooks();
        
        // Setup form event listeners
        this.setupNoteFormListeners();
    }
    
    setupNoteFormListeners() {
        const form = document.getElementById('note-form');
        const cancelBtn = document.getElementById('cancel-note-btn');
        const backBtn = document.getElementById('back-to-category-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBook();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.showCategoryDetail();
        });
        
        backBtn.addEventListener('click', () => {
            this.showCategoryDetail();
        });
    }
    
    async saveBook() {
        const form = document.getElementById('note-form');
        const formData = new FormData(form);
        
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            year: formData.get('year') ? parseInt(formData.get('year')) : null,
            genre: formData.get('genre'),
            rating: formData.get('rating') ? parseInt(formData.get('rating')) : null,
            pages: formData.get('pages') ? parseInt(formData.get('pages')) : null,
            notes: formData.get('notes'),
            category: this.currentNoteContext.category,
            subcategory: `${this.currentNoteContext.subcategory}.${this.currentNoteContext.subSubcategory}`,
            body_part: 'head',
            type: 'learning',
            read_date: formData.get('status') === 'read' ? new Date().toISOString().split('T')[0] : null,
            created_at: new Date().toISOString()
        };
        
        try {
            await ipcRenderer.invoke('db-run', 
                `INSERT INTO books (title, author, year, genre, rating, pages, notes, category, subcategory, body_part, type, read_date, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [bookData.title, bookData.author, bookData.year, bookData.genre, bookData.rating, 
                 bookData.pages, bookData.notes, bookData.category, bookData.subcategory, 
                 bookData.body_part, bookData.type, bookData.read_date, bookData.created_at]
            );
            
            // Clear form
            form.reset();
            
            // Reload recent books
            this.loadRecentBooks();
            
            // Update entry counts
            this.updateEntryCounts();
            
            // Show success message
            this.showSuccessMessage('Book saved successfully!');
            
        } catch (error) {
            console.error('Error saving book:', error);
            this.showErrorMessage('Failed to save book. Please try again.');
        }
    }
    
    async loadRecentBooks() {
        try {
            const books = await ipcRenderer.invoke('db-query', 
                `SELECT * FROM books WHERE category = ? AND subcategory = ? ORDER BY created_at DESC LIMIT 10`,
                [this.currentNoteContext.category, `${this.currentNoteContext.subcategory}.${this.currentNoteContext.subSubcategory}`]
            );
            
            this.displayRecentBooks(books);
        } catch (error) {
            console.error('Error loading recent books:', error);
        }
    }
    
    displayRecentBooks(books) {
        const booksList = document.getElementById('recent-books-list');
        
        if (books.length === 0) {
            booksList.innerHTML = '<p style="color: #9ca3af; font-size: 0.875rem;">No books added yet. Start by adding your first book!</p>';
            return;
        }
        
        booksList.innerHTML = books.map(book => `
            <div class="book-item">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author || 'Unknown Author'}</div>
                <div class="book-status">${book.year ? book.year : ''} ${book.pages ? `• ${book.pages} pages` : ''}</div>
            </div>
        `).join('');
    }
    
    updateEntryCounts() {
        // Update main category counts
        this.loadCategoryStats(this.currentNoteContext.category);
        
        // Update subcategory counts
        this.loadSubcategoryCounts(this.currentNoteContext.category);
    }
    
    showSuccessMessage(message) {
        // Simple success message (could be enhanced with a toast notification)
        console.log('Success:', message);
    }
    
    showErrorMessage(message) {
        // Simple error message (could be enhanced with a toast notification)
        console.error('Error:', message);
    }
    
    showCategoryDetail() {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show category detail section
        document.getElementById('category-detail-section').classList.add('active');
        
        // Update UI
        document.getElementById('category-title').textContent = this.getCategoryInfo(this.currentCategory).name;
        document.getElementById('category-description').textContent = this.getCategoryInfo(this.currentCategory).description;
        
        // Show subcategories
        this.showSubcategories(this.currentCategory);
        
        // Load category data
        this.loadCategoryDetail(this.currentCategory);
    }
    
    loadSubSubcategoryItems(category, subcategory, subSubcategory) {
        const tableMapping = {
            intellectual: 'books',
            emotional: 'preferences',
            physical: 'shops',
            beyond: 'preferences'
        };
        
        const table = tableMapping[category];
        if (!table) return;
        
        const fullSubcategory = `${subcategory}.${subSubcategory}`;
        
        ipcRenderer.invoke('db-query', 
            `SELECT * FROM ${table} WHERE category = ? AND subcategory = ? ORDER BY created_at DESC`, 
            [category, fullSubcategory]
        ).then(items => {
            this.displayItems(items, category, fullSubcategory);
        }).catch(err => console.error('Error loading sub-subcategory items:', err));
    }
    
    loadSubcategoryCounts(category) {
        const subcategories = this.subcategories[category] || [];
        
        subcategories.forEach(sub => {
            // Count items in this subcategory
            const tableMapping = {
                intellectual: 'books',
                emotional: 'preferences',
                physical: 'shops',
                beyond: 'preferences'
            };
            
            const table = tableMapping[category];
            if (table) {
                ipcRenderer.invoke('db-query', 
                    `SELECT COUNT(*) as count FROM ${table} WHERE category = ? AND subcategory = ?`, 
                    [category, sub.id]
                ).then(result => {
                    const count = result[0]?.count || 0;
                    const card = document.querySelector(`[data-subcategory="${sub.id}"] .subcategory-count`);
                    if (card) {
                        card.textContent = `${count} entries`;
                    }
                }).catch(err => console.error('Error loading subcategory count:', err));
            }
        });
    }
    
    loadSubcategoryItems(category, subcategory) {
        const tableMapping = {
            intellectual: 'books',
            emotional: 'preferences',
            physical: 'shops',
            beyond: 'preferences'
        };
        
        const table = tableMapping[category];
        if (!table) return;
        
        ipcRenderer.invoke('db-query', 
            `SELECT * FROM ${table} WHERE category = ? AND subcategory = ? ORDER BY created_at DESC`, 
            [category, subcategory]
        ).then(items => {
            this.displayItems(items, category, subcategory);
        }).catch(err => console.error('Error loading subcategory items:', err));
    }

    async loadCategoryDetail(category) {
        const categoryInfo = this.getCategoryInfo(category);
        
        // Update header
        document.getElementById('category-title').textContent = categoryInfo.name;
        document.getElementById('category-description').textContent = categoryInfo.description;

        // Load category stats
        await this.loadCategoryStats(category);
        
        // Load category items
        await this.loadCategoryItems(category);
    }


    getCategoryInfo(category) {
        const categories = {
            intellectual: {
                name: 'Intellectual',
                description: 'Books, learning, ideas, knowledge, and mental pursuits'
            },
            emotional: {
                name: 'Emotional',
                description: 'Relationships, values, feelings, and what moves you'
            },
            physical: {
                name: 'Physical Action',
                description: 'Health, fitness, movement, work, and physical activities'
            },
            beyond: {
                name: 'Above & Beyond',
                description: 'Spiritual, creative, transcendent, and extraordinary experiences'
            }
        };

        return categories[category] || { name: 'Unknown', description: 'Unknown category' };
    }

    async loadCategoryStats(category) {
        try {
            // Get count for this category
            const tableMapping = {
                intellectual: 'books',
                emotional: 'preferences',
                physical: 'preferences',
                beyond: 'preferences'
            };
            
            const table = tableMapping[category] || 'preferences';
            const countQuery = table === 'preferences' 
                ? `SELECT COUNT(*) as count FROM ${table} WHERE category = ?`
                : `SELECT COUNT(*) as count FROM ${table} WHERE category = ?`;
            
            const countResult = await ipcRenderer.invoke('db-query', countQuery, [category]);
            
            // Get recent count (last 7 days)
            const recentQuery = table === 'preferences'
                ? `SELECT COUNT(*) as count FROM ${table} WHERE category = ? AND created_at >= datetime('now', '-7 days')`
                : `SELECT COUNT(*) as count FROM ${table} WHERE category = ? AND created_at >= datetime('now', '-7 days')`;
            
            const recentResult = await ipcRenderer.invoke('db-query', recentQuery, [category]);

            document.getElementById('category-count').textContent = countResult[0].count;
            document.getElementById('category-recent').textContent = recentResult[0].count;
        } catch (error) {
            console.error('Error loading category stats:', error);
        }
    }

    async loadCategoryItems(category) {
        try {
            const tableMapping = {
                intellectual: 'books',
                emotional: 'preferences',
                physical: 'preferences',
                beyond: 'preferences'
            };
            
            const table = tableMapping[category] || 'preferences';
            const query = table === 'preferences'
                ? `SELECT * FROM ${table} WHERE category = ? ORDER BY created_at DESC`
                : `SELECT * FROM ${table} WHERE category = ? ORDER BY created_at DESC`;
            
            const items = await ipcRenderer.invoke('db-query', query, [category]);
            this.renderCategoryItems(items, category);
        } catch (error) {
            console.error('Error loading category items:', error);
        }
    }

    renderCategoryItems(items, category) {
        const container = document.getElementById('category-items-list');
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No items yet. Add your first item to this category!</p>';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-card';
            
            const title = item.title || item.name || item.item;
            const subtitle = this.getItemSubtitle(item, category);
            const rating = item.rating || item.intensity;

            itemElement.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${title}</div>
                        <div class="item-subtitle">${subtitle}</div>
                    </div>
                    ${rating ? `<div class="item-rating">${this.renderStars(rating)}</div>` : ''}
                </div>
                ${item.notes ? `<p class="text-sm text-gray-600 mt-2">${item.notes}</p>` : ''}
                <div class="item-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.editItem(${item.id}, '${category}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.deleteItem(${item.id}, '${category}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            container.appendChild(itemElement);
        });
    }

    getItemSubtitle(item, category) {
        switch (category) {
            case 'intellectual':
                return `${item.author || 'Unknown author'} • ${item.year || 'Unknown year'}`;
            case 'emotional':
                return `${item.type || 'Unknown type'} • Intensity: ${item.intensity || 'N/A'}`;
            case 'physical':
                return `${item.type || 'Unknown type'} • ${item.status || 'Unknown status'}`;
            case 'beyond':
                return `${item.type || 'Unknown type'} • ${item.intensity || 'Unknown intensity'}`;
            default:
                return 'Unknown details';
        }
    }

    openCategoryModal() {
        if (!this.currentCategory) return;
        
        const categoryInfo = this.getCategoryInfo(this.currentCategory);
        const modal = document.getElementById('item-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('item-form');

        modalTitle.textContent = `Add to ${categoryInfo.name}`;
        form.innerHTML = this.getBodyPartFormFields(this.currentCategory);

        modal.classList.add('active');
    }

    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(`${section}-section`).classList.add('active');

        // Update header
        const titles = {
            dashboard: 'Dashboard',
            movies: 'Movies',
            books: 'Books',
            shops: 'Shops',
            magazines: 'Magazines',
            preferences: 'Preferences'
        };

        const subtitles = {
            dashboard: 'Overview of your personal data',
            movies: 'Manage your movie collection',
            books: 'Track your reading list',
            shops: 'Your favorite stores and shops',
            magazines: 'Magazine subscriptions and issues',
            preferences: 'Personal preferences and settings'
        };

        document.getElementById('section-title').textContent = titles[section];
        document.getElementById('section-subtitle').textContent = subtitles[section];

        this.currentSection = section;
        this.setupNavigation();

        // Load section data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'movies':
                await this.loadMovies();
                break;
            case 'books':
                await this.loadBooks();
                break;
            case 'shops':
                await this.loadShops();
                break;
            case 'magazines':
                await this.loadMagazines();
                break;
            case 'preferences':
                await this.loadPreferences();
                break;
        }
    }

    async loadMainBody() {
        try {
            // Get counts for each category
            const [movies, books, shops, magazines] = await Promise.all([
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM movies'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM books'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM shops'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM magazines')
            ]);

            // Calculate total entries
            const totalEntries = movies[0].count + books[0].count + shops[0].count + magazines[0].count;
            
            // Update anatomical map stats
            document.getElementById('total-entries').textContent = totalEntries;
            document.getElementById('active-categories').textContent = this.getActiveCategories(movies, books, shops, magazines);
            
            // Get recent activity (entries from last 7 days)
            const recentActivity = await this.getRecentActivity();
            document.getElementById('recent-activity').textContent = recentActivity;

            // Load insights
            await this.loadInsights();

            // Load recent items
            await this.loadRecentItems();
        } catch (error) {
            console.error('Error loading main body:', error);
        }
    }

    getActiveCategories(movies, books, shops, magazines) {
        let activeCount = 0;
        if (movies[0].count > 0) activeCount++;
        if (books[0].count > 0) activeCount++;
        if (shops[0].count > 0) activeCount++;
        if (magazines[0].count > 0) activeCount++;
        return activeCount;
    }

    async getRecentActivity() {
        try {
            const recentActivity = await ipcRenderer.invoke('db-query', `
                SELECT COUNT(*) as count FROM (
                    SELECT created_at FROM movies WHERE created_at >= datetime('now', '-7 days')
                    UNION ALL
                    SELECT created_at FROM books WHERE created_at >= datetime('now', '-7 days')
                    UNION ALL
                    SELECT created_at FROM shops WHERE created_at >= datetime('now', '-7 days')
                    UNION ALL
                    SELECT created_at FROM magazines WHERE created_at >= datetime('now', '-7 days')
                )
            `);
            return recentActivity[0].count;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            return 0;
        }
    }

    async loadInsights() {
        try {
            const insights = await this.generateInsights();
            const insightsList = document.getElementById('insights-list');
            insightsList.innerHTML = '';

            if (insights.length === 0) {
                insightsList.innerHTML = '<p class="text-gray-500">Start adding entries to see insights about your knowledge patterns!</p>';
                return;
            }

            insights.forEach(insight => {
                const insightElement = document.createElement('div');
                insightElement.className = 'insight-item';
                insightElement.textContent = insight;
                insightsList.appendChild(insightElement);
            });
        } catch (error) {
            console.error('Error loading insights:', error);
        }
    }

    async generateInsights() {
        const insights = [];
        
        try {
            // Get category counts
            const [movies, books, shops, magazines] = await Promise.all([
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM movies'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM books'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM shops'),
                ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM magazines')
            ]);

            const totalEntries = movies[0].count + books[0].count + shops[0].count + magazines[0].count;

            if (totalEntries === 0) {
                return insights;
            }

            // Generate insights based on data
            if (movies[0].count > books[0].count) {
                insights.push("You're more into visual entertainment than reading");
            } else if (books[0].count > movies[0].count) {
                insights.push("You prefer books over movies - a true knowledge seeker!");
            }

            if (shops[0].count > 0) {
                insights.push(`You've tracked ${shops[0].count} places - you're quite the explorer!`);
            }

            if (totalEntries > 10) {
                insights.push("You're building a comprehensive knowledge base!");
            }

            return insights.slice(0, 3); // Limit to 3 insights
        } catch (error) {
            console.error('Error generating insights:', error);
            return insights;
        }
    }

    openBodyPartModal(category, name) {
        this.currentBodyPart = { category, name };
        const modal = document.getElementById('item-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('item-form');

        modalTitle.textContent = `Add to ${name}`;
        form.innerHTML = this.getBodyPartFormFields(category);

        modal.classList.add('active');
    }

    getBodyPartFormFields(category) {
        const fieldMappings = {
            mind: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Book title, concept, or idea">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="book">Book</option>
                        <option value="concept">Concept/Idea</option>
                        <option value="skill">Skill</option>
                        <option value="learning">Learning Resource</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="author">Author/Creator</label>
                    <input type="text" id="author" name="author">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Notes & Insights</label>
                    <textarea id="notes" name="notes" placeholder="What did you learn? Key insights?"></textarea>
                </div>
            `,
            visual: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Movie, artwork, or visual content">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="movie">Movie</option>
                        <option value="art">Artwork</option>
                        <option value="photo">Photography</option>
                        <option value="design">Design</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="year">Year</label>
                    <input type="number" id="year" name="year" min="1900" max="2030">
                </div>
                <div class="form-group">
                    <label for="genre">Genre/Style</label>
                    <input type="text" id="genre" name="genre">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Visual Notes</label>
                    <textarea id="notes" name="notes" placeholder="What caught your eye? Visual impact?"></textarea>
                </div>
            `,
            taste: `
                <div class="form-group">
                    <label for="title">Name *</label>
                    <input type="text" id="title" name="title" required placeholder="Food, drink, or restaurant name">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="food">Food</option>
                        <option value="drink">Drink</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="recipe">Recipe</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Taste Notes</label>
                    <textarea id="notes" name="notes" placeholder="Flavors, textures, experience..."></textarea>
                </div>
            `,
            emotions: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Emotion, relationship, or value">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="emotion">Emotion</option>
                        <option value="relationship">Relationship</option>
                        <option value="value">Personal Value</option>
                        <option value="memory">Memory</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="intensity">Intensity (1-5)</label>
                    <select id="intensity" name="intensity">
                        <option value="">Select intensity</option>
                        <option value="1">Very Low</option>
                        <option value="2">Low</option>
                        <option value="3">Medium</option>
                        <option value="4">High</option>
                        <option value="5">Very High</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Emotional Notes</label>
                    <textarea id="notes" name="notes" placeholder="How does this make you feel? Why is it important?"></textarea>
                </div>
            `,
            breathing: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Activity, exercise, or wellness practice">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="exercise">Exercise</option>
                        <option value="meditation">Meditation</option>
                        <option value="sport">Sport</option>
                        <option value="wellness">Wellness Practice</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="duration">Duration</label>
                    <input type="text" id="duration" name="duration" placeholder="e.g., 30 minutes, 1 hour">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Activity Notes</label>
                    <textarea id="notes" name="notes" placeholder="How did it feel? Benefits?"></textarea>
                </div>
            `,
            nutrition: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Food, supplement, or nutrition item">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="food">Food</option>
                        <option value="supplement">Supplement</option>
                        <option value="diet">Diet Plan</option>
                        <option value="nutrition">Nutrition Info</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="benefits">Benefits</label>
                    <input type="text" id="benefits" name="benefits" placeholder="Health benefits or effects">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Nutrition Notes</label>
                    <textarea id="notes" name="notes" placeholder="How does this affect your body?"></textarea>
                </div>
            `,
            work: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Project, skill, or work item">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="project">Project</option>
                        <option value="skill">Skill</option>
                        <option value="tool">Tool</option>
                        <option value="hobby">Hobby</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="learning">Learning</option>
                        <option value="practicing">Practicing</option>
                        <option value="mastered">Mastered</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Work Notes</label>
                    <textarea id="notes" name="notes" placeholder="Progress, challenges, achievements..."></textarea>
                </div>
            `,
            movement: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required placeholder="Place, travel, or movement">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="place">Place</option>
                        <option value="travel">Travel</option>
                        <option value="activity">Activity</option>
                        <option value="adventure">Adventure</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Movement Notes</label>
                    <textarea id="notes" name="notes" placeholder="Experience, memories, feelings..."></textarea>
                </div>
            `
        };

        return fieldMappings[category] || fieldMappings.mind;
    }

    async loadRecentItems() {
        try {
            const recentItems = await ipcRenderer.invoke('db-query', `
                SELECT 'movie' as type, title, created_at FROM movies 
                UNION ALL
                SELECT 'book' as type, title, created_at FROM books
                UNION ALL
                SELECT 'shop' as type, name as title, created_at FROM shops
                UNION ALL
                SELECT 'magazine' as type, title, created_at FROM magazines
                ORDER BY created_at DESC LIMIT 10
            `);

            const container = document.getElementById('recent-items-list');
            container.innerHTML = '';

            if (recentItems.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No items yet. Add your first item!</p>';
                return;
            }

            recentItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'item-card';
                itemElement.innerHTML = `
                    <div class="item-header">
                        <div>
                            <div class="item-title">${item.title}</div>
                            <div class="item-subtitle">${item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${new Date(item.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
                container.appendChild(itemElement);
            });
        } catch (error) {
            console.error('Error loading recent items:', error);
        }
    }

    async loadMovies() {
        try {
            const movies = await ipcRenderer.invoke('db-query', 'SELECT * FROM movies ORDER BY created_at DESC');
            this.renderItems(movies, 'movies-list', 'movie');
        } catch (error) {
            console.error('Error loading movies:', error);
        }
    }

    async loadBooks() {
        try {
            const books = await ipcRenderer.invoke('db-query', 'SELECT * FROM books ORDER BY created_at DESC');
            this.renderItems(books, 'books-list', 'book');
        } catch (error) {
            console.error('Error loading books:', error);
        }
    }

    async loadShops() {
        try {
            const shops = await ipcRenderer.invoke('db-query', 'SELECT * FROM shops ORDER BY created_at DESC');
            this.renderItems(shops, 'shops-list', 'shop');
        } catch (error) {
            console.error('Error loading shops:', error);
        }
    }

    async loadMagazines() {
        try {
            const magazines = await ipcRenderer.invoke('db-query', 'SELECT * FROM magazines ORDER BY created_at DESC');
            this.renderItems(magazines, 'magazines-list', 'magazine');
        } catch (error) {
            console.error('Error loading magazines:', error);
        }
    }

    async loadPreferences() {
        try {
            const preferences = await ipcRenderer.invoke('db-query', 'SELECT * FROM preferences ORDER BY category, created_at DESC');
            this.renderPreferences(preferences);
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    renderItems(items, containerId, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No items yet. Add your first item!</p>';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-card';
            
            let title, subtitle, rating;
            
            switch (type) {
                case 'movie':
                    title = item.title;
                    subtitle = `${item.year || 'Unknown year'} • ${item.genre || 'Unknown genre'}`;
                    rating = item.rating;
                    break;
                case 'book':
                    title = item.title;
                    subtitle = `${item.author || 'Unknown author'} • ${item.year || 'Unknown year'}`;
                    rating = item.rating;
                    break;
                case 'shop':
                    title = item.name;
                    subtitle = `${item.category || 'Unknown category'} • ${item.location || 'Unknown location'}`;
                    rating = item.rating;
                    break;
                case 'magazine':
                    title = item.title;
                    subtitle = `${item.publisher || 'Unknown publisher'} • ${item.category || 'Unknown category'}`;
                    rating = item.rating;
                    break;
            }

            itemElement.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${title}</div>
                        <div class="item-subtitle">${subtitle}</div>
                    </div>
                    ${rating ? `<div class="item-rating">${this.renderStars(rating)}</div>` : ''}
                </div>
                ${item.notes ? `<p class="text-sm text-gray-600 mt-2">${item.notes}</p>` : ''}
                <div class="item-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.editItem(${item.id}, '${type}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.deleteItem(${item.id}, '${type}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            container.appendChild(itemElement);
        });
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star ${i <= rating ? 'star' : 'star empty'}"></i>`;
        }
        return stars;
    }

    renderPreferences(preferences) {
        const categories = {
            'food': 'food-preferences',
            'entertainment': 'entertainment-preferences',
            'lifestyle': 'lifestyle-preferences'
        };

        Object.keys(categories).forEach(category => {
            const container = document.getElementById(categories[category]);
            container.innerHTML = '';

            const categoryPrefs = preferences.filter(p => p.category === category);
            
            if (categoryPrefs.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No preferences yet.</p>';
                return;
            }

            categoryPrefs.forEach(pref => {
                const prefElement = document.createElement('div');
                prefElement.className = 'preference-item';
                prefElement.innerHTML = `
                    <span>${pref.item}</span>
                    <div>
                        <span class="text-sm text-gray-500">${pref.value || ''}</span>
                        <button class="btn btn-small btn-secondary ml-2" onclick="app.editPreference(${pref.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                `;
                container.appendChild(prefElement);
            });
        });
    }

    openModal(item = null, type = null) {
        this.currentItem = item;
        const modal = document.getElementById('item-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('item-form');

        if (item) {
            modalTitle.textContent = `Edit ${type}`;
            this.populateForm(item, type);
        } else {
            modalTitle.textContent = `Add ${this.currentSection.slice(0, -1)}`;
            form.innerHTML = this.getFormFields(this.currentSection);
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('item-modal').classList.remove('active');
        this.currentItem = null;
        this.currentBodyPart = null;
        document.getElementById('item-form').innerHTML = '';
    }

    getFormFields(section) {
        const fields = {
            movies: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="year">Year</label>
                    <input type="number" id="year" name="year" min="1900" max="2030">
                </div>
                <div class="form-group">
                    <label for="genre">Genre</label>
                    <input type="text" id="genre" name="genre">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="director">Director</label>
                    <input type="text" id="director" name="director">
                </div>
                <div class="form-group">
                    <label for="actors">Actors</label>
                    <input type="text" id="actors" name="actors">
                </div>
                <div class="form-group">
                    <label for="plot">Plot</label>
                    <textarea id="plot" name="plot"></textarea>
                </div>
                <div class="form-group">
                    <label for="watched_date">Watched Date</label>
                    <input type="date" id="watched_date" name="watched_date">
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes"></textarea>
                </div>
            `,
            books: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="author">Author</label>
                    <input type="text" id="author" name="author">
                </div>
                <div class="form-group">
                    <label for="year">Year</label>
                    <input type="number" id="year" name="year" min="1900" max="2030">
                </div>
                <div class="form-group">
                    <label for="genre">Genre</label>
                    <input type="text" id="genre" name="genre">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="pages">Pages</label>
                    <input type="number" id="pages" name="pages" min="1">
                </div>
                <div class="form-group">
                    <label for="isbn">ISBN</label>
                    <input type="text" id="isbn" name="isbn">
                </div>
                <div class="form-group">
                    <label for="read_date">Read Date</label>
                    <input type="date" id="read_date" name="read_date">
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes"></textarea>
                </div>
            `,
            shops: `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="category">Category</label>
                    <input type="text" id="category" name="category">
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location">
                </div>
                <div class="form-group">
                    <label for="website">Website</label>
                    <input type="url" id="website" name="website">
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes"></textarea>
                </div>
            `,
            magazines: `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="publisher">Publisher</label>
                    <input type="text" id="publisher" name="publisher">
                </div>
                <div class="form-group">
                    <label for="category">Category</label>
                    <input type="text" id="category" name="category">
                </div>
                <div class="form-group">
                    <label for="issue_number">Issue Number</label>
                    <input type="text" id="issue_number" name="issue_number">
                </div>
                <div class="form-group">
                    <label for="publication_date">Publication Date</label>
                    <input type="date" id="publication_date" name="publication_date">
                </div>
                <div class="form-group">
                    <label for="rating">Rating (1-5)</label>
                    <select id="rating" name="rating">
                        <option value="">Select rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes"></textarea>
                </div>
            `
        };

        return fields[section] || '';
    }

    populateForm(item, type) {
        const form = document.getElementById('item-form');
        form.innerHTML = this.getFormFields(type);

        // Populate form fields
        Object.keys(item).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = item[key] || '';
            }
        });
    }

    async saveItem() {
        const form = document.getElementById('item-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            if (this.currentItem) {
                // Update existing item
                const table = this.currentSection.slice(0, -1);
                const query = `UPDATE ${table}s SET ${Object.keys(data).map(key => `${key} = ?`).join(', ')} WHERE id = ?`;
                const values = [...Object.values(data), this.currentItem.id];
                await ipcRenderer.invoke('db-run', query, values);
            } else if (this.currentBodyPart || this.currentCategory) {
                // Save to body part category - map to appropriate table
                const category = this.currentBodyPart ? this.currentBodyPart.category : this.currentCategory;
                const tableMapping = {
                    mind: 'books',
                    visual: 'movies', 
                    taste: 'shops',
                    emotions: 'preferences',
                    breathing: 'preferences',
                    nutrition: 'preferences',
                    work: 'preferences',
                    movement: 'shops'
                };
                
                const table = tableMapping[category] || 'preferences';
                
                // Add category info to data
                data.category = category;
                if (this.currentBodyPart) {
                    data.body_part = this.currentBodyPart.name;
                }
                
                const query = `INSERT INTO ${table} (${Object.keys(data).join(', ')}) VALUES (${Object.keys(data).map(() => '?').join(', ')})`;
                await ipcRenderer.invoke('db-run', query, Object.values(data));
            } else {
                // Insert new item
                const table = this.currentSection.slice(0, -1);
                const query = `INSERT INTO ${table}s (${Object.keys(data).join(', ')}) VALUES (${Object.keys(data).map(() => '?').join(', ')})`;
                await ipcRenderer.invoke('db-run', query, Object.values(data));
            }

            this.closeModal();
            this.currentBodyPart = null;
            
            // Refresh current view
            if (this.currentSection === 'main-body') {
                await this.loadMainBody();
            } else if (this.currentSection === 'category-detail' && this.currentCategory) {
                await this.loadCategoryDetail(this.currentCategory);
            }
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Error saving item. Please try again.');
        }
    }

    async editItem(id, type) {
        try {
            const table = type + 's';
            const items = await ipcRenderer.invoke('db-query', `SELECT * FROM ${table} WHERE id = ?`, [id]);
            if (items.length > 0) {
                this.openModal(items[0], type);
            }
        } catch (error) {
            console.error('Error loading item for edit:', error);
        }
    }

    async deleteItem(id, type) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const table = type + 's';
                await ipcRenderer.invoke('db-run', `DELETE FROM ${table} WHERE id = ?`, [id]);
                await this.loadSectionData(this.currentSection);
                if (this.currentSection === 'dashboard') {
                    await this.loadDashboard();
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Error deleting item. Please try again.');
            }
        }
    }

    async performGlobalSearch(query) {
        if (query.length < 2) return;

        try {
            const results = await ipcRenderer.invoke('db-query', `
                SELECT 'movie' as type, title, id FROM movies WHERE title LIKE ?
                UNION ALL
                SELECT 'book' as type, title, id FROM books WHERE title LIKE ?
                UNION ALL
                SELECT 'shop' as type, name as title, id FROM shops WHERE name LIKE ?
                UNION ALL
                SELECT 'magazine' as type, title, id FROM magazines WHERE title LIKE ?
                ORDER BY title
            `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);

            // Display search results (you can implement a dropdown or modal for this)
            console.log('Search results:', results);
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }

    async applyFilter(filterId, value) {
        // Implement filtering logic based on the filter type
        console.log('Applying filter:', filterId, value);
        // This would reload the current section with the applied filter
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const openBtn = document.getElementById('open-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.add('hidden');
        mainContent.classList.add('sidebar-hidden');
        openBtn.classList.add('show');
        overlay.classList.remove('show');
    }
    
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const openBtn = document.getElementById('open-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('sidebar-hidden');
        openBtn.classList.remove('show');
        overlay.classList.add('show');
    }
    
    async handleSmartSearch(query) {
        if (!query || query.trim().length < 2) {
            document.getElementById('smart-search-results').classList.remove('show');
            return;
        }
        
        const resultsContainer = document.getElementById('smart-search-results');
        resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center;">Searching...</div>';
        resultsContainer.classList.add('show');
        
        try {
            // Determine category from current context
            const category = this.currentCategory || 'books';
            const results = await window.apiService.search(query, category);
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #64748b;">No results found</div>';
                return;
            }
            
            resultsContainer.innerHTML = results.map(result => `
                <div class="search-result-item" data-result='${JSON.stringify(result)}'>
                    ${result.thumbnail ? `<img src="${result.thumbnail}" class="search-result-image" alt="${result.title}">` : '<div class="search-result-image"></div>'}
                    <div class="search-result-info">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-meta">
                            ${result.author || result.director || 'Unknown'} ${result.year ? `• ${result.year}` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const data = JSON.parse(item.dataset.result);
                    this.fillFormFromSearchResult(data);
                    resultsContainer.classList.remove('show');
                    document.getElementById('smart-search-input').value = '';
                });
            });
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #ef4444;">Error searching. Please try again.</div>';
        }
    }
    
    fillFormFromSearchResult(data) {
        // Fill form fields based on the search result
        document.getElementById('item-title').value = data.title || '';
        document.getElementById('item-creator').value = data.author || data.director || '';
        document.getElementById('item-year').value = data.year || '';
        
        if (data.description) {
            document.getElementById('item-notes').value = data.description;
        }
        
        // Store full data for later use
        this.currentSearchData = data;
    }
    
    async refreshCategoryView() {
        if (!this.currentCategory) return;
        
        // Reload category items with current filters
        await this.loadCategoryItems(this.currentCategory);
    }
    
    async loadCategoryItems(category) {
        const container = document.getElementById('category-items-container');
        if (!container) return;
        
        try {
            // Query database for items in this category
            const query = `SELECT * FROM books WHERE 1=1`;
            const items = await ipcRenderer.invoke('db-query', query, []);
            
            // Apply filters
            let filteredItems = items;
            
            if (this.currentFilter.search) {
                const searchLower = this.currentFilter.search.toLowerCase();
                filteredItems = filteredItems.filter(item =>
                    item.title?.toLowerCase().includes(searchLower) ||
                    item.author?.toLowerCase().includes(searchLower)
                );
            }
            
            if (this.currentFilter.status !== 'all') {
                filteredItems = filteredItems.filter(item =>
                    item.status === this.currentFilter.status
                );
            }
            
            // Apply sorting
            filteredItems.sort((a, b) => {
                switch (this.currentFilter.sort) {
                    case 'recent':
                        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                    case 'oldest':
                        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                    case 'name':
                        return (a.title || '').localeCompare(b.title || '');
                    case 'rating':
                        return (b.rating || 0) - (a.rating || 0);
                    default:
                        return 0;
                }
            });
            
            // Render items
            if (filteredItems.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No items found. Add your first item to get started!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filteredItems.map(item => this.renderItemCard(item)).join('');
        } catch (error) {
            console.error('Error loading category items:', error);
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #ef4444;">Error loading items</div>';
        }
    }
    
    renderItemCard(item) {
        const statusClass = `status-${item.status?.replace('_', '-') || 'want'}`;
        const statusLabel = {
            'want': 'Want to Try',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        }[item.status] || 'Want to Try';
        
        const stars = item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '';
        
        return `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-card-header">
                    <div>
                        <div class="item-title">${item.title || 'Untitled'}</div>
                        <div class="item-subtitle">${item.author || item.creator || ''}</div>
                    </div>
                    <span class="item-status-badge ${statusClass}">${statusLabel}</span>
                </div>
                ${item.rating ? `<div class="item-rating">${stars}</div>` : ''}
                <div class="item-meta">
                    ${item.year ? `<span><i class="fas fa-calendar"></i>${item.year}</span>` : ''}
                    ${item.genre ? `<span><i class="fas fa-tag"></i>${item.genre}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    showSection(section) {
        this.currentSection = section;
        this.currentCategory = section === 'dashboard' ? null : section;
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-section="${section}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.remove('active');
        });
        
        // Show selected section
        if (section === 'dashboard') {
            document.getElementById('dashboard-section').classList.add('active');
            this.loadEnhancedDashboard();
        } else if (section === 'collection-dashboard') {
            const collectionSection = document.getElementById('collection-dashboard');
            if (collectionSection) collectionSection.classList.add('active');
        } else if (section === 'professional-dashboard') {
            const professionalSection = document.getElementById('professional-dashboard');
            if (professionalSection) professionalSection.classList.add('active');
        } else if (section === 'note-taking') {
            const noteTakingSection = document.getElementById('note-taking-section');
            if (noteTakingSection) noteTakingSection.classList.add('active');
        } else {
            // For categories, show category detail
            this.showCategoryDetail(section);
        }
    }
    
    async loadEnhancedDashboard() {
        try {
            // Load stats for each category
            const categories = ['intellectual', 'emotional', 'physical', 'beyond'];
            
            for (const category of categories) {
                const count = await this.getCategoryCount(category);
                const weekCount = await this.getWeekCount(category);
                
                document.getElementById(`stat-${category}`).textContent = count;
                document.getElementById(`stat-${category}-detail`).textContent = `${weekCount} this week`;
            }
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Load quick stats
            await this.loadQuickStats();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    async getCategoryCount(category) {
        try {
            const result = await ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM books', []);
            return result[0]?.count || 0;
        } catch (error) {
            return 0;
        }
    }
    
    async getWeekCount(category) {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const result = await ipcRenderer.invoke('db-query',
                'SELECT COUNT(*) as count FROM books WHERE created_at >= ?',
                [weekAgo.toISOString()]
            );
            return result[0]?.count || 0;
        } catch (error) {
            return 0;
        }
    }
    
    async loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        try {
            const items = await ipcRenderer.invoke('db-query',
                'SELECT * FROM books ORDER BY created_at DESC LIMIT 5',
                []
            );
            
            if (items.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No recent activity</div>';
                return;
            }
            
            container.innerHTML = items.map(item => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: #eff6ff; color: #3b82f6;">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${item.title}</div>
                        <div class="activity-meta">${item.author || 'Unknown'} • Added ${this.formatDate(item.created_at)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
    
    async loadQuickStats() {
        try {
            const booksCount = await ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM books', []);
            document.getElementById('books-count').textContent = booksCount[0]?.count || 0;
            
            const moviesCount = await ipcRenderer.invoke('db-query', 'SELECT COUNT(*) as count FROM movies', []);
            document.getElementById('movies-count').textContent = moviesCount[0]?.count || 0;
            
            // Set placeholders for music and workouts
            document.getElementById('music-count').textContent = '0';
            document.getElementById('workouts-count').textContent = '0';
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }
    
    showCategoryDetail(category) {
        this.currentCategory = category;
        
        // Show category detail section
        document.getElementById('category-detail-section').classList.add('active');
        
        // Update header
        const categoryInfo = this.getCategoryInfo(category);
        document.getElementById('category-title').textContent = categoryInfo.title;
        document.getElementById('category-description').textContent = categoryInfo.description;
        
        // Create brain visualization with subcategories
        this.createBrainVisualization(category);
    }
    
    async createBrainVisualization(category) {
        const bubblesContainer = document.getElementById('knowledge-bubbles');
        const svg = document.getElementById('brain-svg');
        const nodesGroup = document.getElementById('knowledge-nodes');
        
        if (!bubblesContainer || !svg || !nodesGroup) return;
        
        // Show the correct central shape based on category
        this.showCategoryShape(category);
        
        // Clear previous content
        bubblesContainer.innerHTML = '';
        nodesGroup.innerHTML = '';
        
        const subcats = this.subcategories[category] || {};
        const subcatKeys = Object.keys(subcats);
        
        if (subcatKeys.length === 0) {
            bubblesContainer.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #64748b;">No knowledge areas yet</div>';
            return;
        }
        
        // Get counts for each subcategory
        const subcatsWithCounts = await Promise.all(
            subcatKeys.map(async (key) => {
                const count = await this.getSubcategoryCount(category, key);
                return { key, ...subcats[key], count };
            })
        );
        
        // Define better positioned layouts for different numbers of bubbles
        const positions = this.getBubblePositions(subcatsWithCounts.length);
        
        subcatsWithCounts.forEach((subcat, index) => {
            const pos = positions[index];
            
            // Create animated connection line in SVG
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const centerX = 400;
            const centerY = 300;
            const bubbleX = pos.x * 8; // Convert % to SVG coords
            const bubbleY = pos.y * 6;
            
            // Create curved path for more organic look
            const controlX = (centerX + bubbleX) / 2;
            const controlY = (centerY + bubbleY) / 2 + (Math.random() - 0.5) * 100;
            const pathD = `M ${centerX} ${centerY} Q ${controlX} ${controlY} ${bubbleX} ${bubbleY}`;
            
            line.setAttribute('d', pathD);
            line.setAttribute('class', 'connection-line');
            line.setAttribute('fill', 'none');
            line.style.animationDelay = `${index * 0.1}s`;
            nodesGroup.appendChild(line);
            
            // Create bubble with enhanced styling
            const bubble = document.createElement('div');
            bubble.className = 'knowledge-bubble';
            bubble.style.left = `${pos.x}%`;
            bubble.style.top = `${pos.y}%`;
            bubble.style.transform = 'translate(-50%, -50%)';
            bubble.style.animationDelay = `${index * 0.1}s`;
            bubble.dataset.subcategory = subcat.key;
            
            const icon = this.getSubcategoryIcon(subcat.key);
            const color = this.getCategoryColor(category);
            
            bubble.innerHTML = `
                <div class="knowledge-card">
                    <div class="card-icon-circle" style="background: linear-gradient(135deg, ${color}15, ${color}05);">
                        <span class="card-emoji">${icon}</span>
                    </div>
                    <div class="card-title">${subcat.name}</div>
                    <div class="card-count">${subcat.count}</div>
                    <div class="card-label">items</div>
                </div>
            `;
            
            bubble.addEventListener('click', () => {
                this.openSubcategoryPanel(subcat.key, subcat.name);
            });
            
            bubblesContainer.appendChild(bubble);
        });
    }
    
    getBubblePositions(count) {
        // Pre-defined positions for different bubble counts for optimal layout
        const layouts = {
            3: [
                { x: 50, y: 15 },  // Top
                { x: 20, y: 55 },  // Left
                { x: 80, y: 55 }   // Right
            ],
            4: [
                { x: 50, y: 15 },  // Top
                { x: 15, y: 50 },  // Left
                { x: 85, y: 50 },  // Right
                { x: 50, y: 85 }   // Bottom
            ],
            5: [
                { x: 50, y: 10 },  // Top
                { x: 15, y: 35 },  // Top-left
                { x: 85, y: 35 },  // Top-right
                { x: 25, y: 75 },  // Bottom-left
                { x: 75, y: 75 }   // Bottom-right
            ],
            6: [
                { x: 30, y: 15 },  // Top-left
                { x: 70, y: 15 },  // Top-right
                { x: 10, y: 50 },  // Left
                { x: 90, y: 50 },  // Right
                { x: 30, y: 85 },  // Bottom-left
                { x: 70, y: 85 }   // Bottom-right
            ]
        };
        
        // If we have a predefined layout, use it
        if (layouts[count]) {
            return layouts[count];
        }
        
        // Otherwise, generate circular positions
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
            const radiusX = 35;
            const radiusY = 35;
            positions.push({
                x: 50 + radiusX * Math.cos(angle),
                y: 50 + radiusY * Math.sin(angle)
            });
        }
        return positions;
    }
    
    getCategoryColor(category) {
        const colors = {
            'intellectual': '#3b82f6',
            'emotional': '#ec4899',
            'physical': '#10b981',
            'professional': '#8b5cf6',
            'beyond': '#f59e0b'
        };
        return colors[category] || '#3b82f6';
    }
    
    getCategoryGradient(category) {
        const gradients = {
            'intellectual': 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            'emotional': 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
            'physical': 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            'professional': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            'beyond': 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)'
        };
        return gradients[category] || gradients['intellectual'];
    }
    
    showCategoryShape(category) {
        // Hide all shapes first
        const shapes = ['brain-shape', 'heart-shape', 'fire-shape', 'professional-shape', 'beyond-shape'];
        shapes.forEach(shapeId => {
            const shape = document.getElementById(shapeId);
            if (shape) shape.style.display = 'none';
        });
        
        // Hide center emoji
        const centerEmoji = document.getElementById('center-emoji');
        if (centerEmoji) centerEmoji.style.display = 'none';
        
        // Show the correct shape for this category
        const shapeMap = {
            'intellectual': 'brain-shape',
            'emotional': 'heart-shape',
            'physical': 'fire-shape',
            'beyond': 'beyond-shape',
            'professional': 'professional-shape'
        };
        
        const shapeId = shapeMap[category];
        if (shapeId) {
            const shape = document.getElementById(shapeId);
            if (shape) shape.style.display = 'block';
        }
        
        // Show center emoji with category icon
        const categoryEmojis = {
            'intellectual': '🧠',
            'emotional': '❤️',
            'physical': '🔥',
            'professional': '💼',
            'beyond': '✨'
        };
        
        if (centerEmoji && categoryEmojis[category]) {
            centerEmoji.textContent = categoryEmojis[category];
            centerEmoji.style.display = 'block';
        }
    }
    
    getSubcategoryIcon(subcatKey) {
        // Get icon emoji from the subcategories structure
        for (const category in this.subcategories) {
            if (this.subcategories[category][subcatKey]) {
                return this.subcategories[category][subcatKey].icon || '📝';
            }
        }
        return '📝';
    }
    
    async getSubcategoryCount(category, subcategory) {
        try {
            // Query database for count in this subcategory
            const result = await ipcRenderer.invoke('db-query', 
                'SELECT COUNT(*) as count FROM books WHERE subcategory = ?',
                [subcategory]
            );
            return result[0]?.count || 0;
        } catch (error) {
            console.error('Error getting subcategory count:', error);
            return 0;
        }
    }
    
    async openSubcategoryPanel(subcatKey, subcatName) {
        // Get subcategory info
        let subcatInfo = null;
        for (const category in this.subcategories) {
            if (this.subcategories[category][subcatKey]) {
                subcatInfo = this.subcategories[category][subcatKey];
                break;
            }
        }
        
        if (!subcatInfo) return;
        
        // Check if this subcategory has nested subcategories
        if (subcatInfo.subcategories) {
            // Show the professional dashboard with all nested categories
            this.showProfessionalDashboard(subcatKey, subcatInfo);
            return;
        }
        
        // Otherwise, open the detail panel
        const panel = document.getElementById('subcategory-detail-panel');
        const title = document.getElementById('selected-subcategory-title');
        const description = document.getElementById('selected-subcategory-description');
        const icon = document.getElementById('panel-icon');
        const totalCount = document.getElementById('panel-total-count');
        const recentCount = document.getElementById('panel-recent-count');
        
        if (!panel || !title) return;
        
        // Store current subcategory
        this.currentSubcategory = subcatKey;
        
        // Update panel header
        title.textContent = subcatInfo.name;
        if (description) description.textContent = subcatInfo.description;
        if (icon) icon.textContent = subcatInfo.icon;
        
        // Get counts
        const total = await this.getSubcategoryCount(this.currentCategory, subcatKey);
        const recent = await this.getWeekCount(subcatKey);
        
        if (totalCount) totalCount.textContent = total;
        if (recentCount) recentCount.textContent = recent;
        
        // Load recent items preview
        this.loadRecentItemsPreview(subcatKey);
        
        // Show panel
        panel.classList.remove('hidden');
    }
    
    async showProfessionalDashboard(parentKey, parentInfo) {
        // Navigate to a special dashboard view for nested categories
        this.showSection('professional-dashboard');
        
        // Update breadcrumbs
        const categoryName = this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1);
        document.getElementById('breadcrumb-category').textContent = categoryName;
        document.getElementById('breadcrumb-subcategory').textContent = parentInfo.name;
        
        // Get the container
        const container = document.querySelector('#professional-dashboard .subcategory-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const nestedSubcats = parentInfo.subcategories || {};
        const subcatKeys = Object.keys(nestedSubcats);
        
        // Get counts for each nested subcategory
        const subcatsWithCounts = await Promise.all(
            subcatKeys.map(async (key) => {
                const count = await this.getSubcategoryCount(this.currentCategory, key);
                return { key, ...nestedSubcats[key], count };
            })
        );
        
        // Render as a clean grid of cards
        subcatsWithCounts.forEach(subcat => {
            const card = document.createElement('div');
            card.className = 'professional-category-card';
            card.innerHTML = `
                <div class="category-card-icon">${subcat.icon}</div>
                <h3 class="category-card-title">${subcat.name}</h3>
                <p class="category-card-description">${subcat.description}</p>
                <div class="category-card-count">${subcat.count} items</div>
            `;
            
            card.addEventListener('click', () => {
                this.showSubcategoryDashboard(subcat.key);
            });
            
            container.appendChild(card);
        });
    }
    
    async getWeekCount(subcategory) {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weekAgoStr = oneWeekAgo.toISOString();
            
            const result = await ipcRenderer.invoke('db-query', 
                'SELECT COUNT(*) as count FROM books WHERE subcategory = ? AND created_at >= ?',
                [subcategory, weekAgoStr]
            );
            return result[0]?.count || 0;
        } catch (error) {
            console.error('Error getting week count:', error);
            return 0;
        }
    }
    
    async loadRecentItemsPreview(subcatKey) {
        const container = document.getElementById('subcategory-recent-items');
        if (!container) return;
        
        try {
            const items = await ipcRenderer.invoke('db-query',
                'SELECT * FROM books WHERE subcategory = ? ORDER BY created_at DESC LIMIT 5',
                [subcatKey]
            );
            
            if (items.length === 0) {
                container.innerHTML = '<div class="no-items">No items yet. Add your first item!</div>';
                return;
            }
            
            container.innerHTML = items.map(item => `
                <div class="recent-item-preview">
                    <div class="recent-item-title">${this.escapeHtml(item.title || 'Untitled')}</div>
                    <div class="recent-item-meta">${item.author || item.creator || ''}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent items:', error);
            container.innerHTML = '<div class="no-items">Error loading items</div>';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async showSubcategoryDashboard(subcatKey) {
        // Show the collection dashboard section
        this.showSection('collection-dashboard');
        
        // Get subcategory info
        let subcatInfo = null;
        let categoryName = '';
        for (const category in this.subcategories) {
            if (this.subcategories[category][subcatKey]) {
                subcatInfo = this.subcategories[category][subcatKey];
                categoryName = this.getCategoryInfo(category).name;
                break;
            }
        }
        
        if (!subcatInfo) return;
        
        // Update breadcrumb
        const breadcrumbCategory = document.getElementById('breadcrumb-category');
        const breadcrumbSubcategory = document.getElementById('breadcrumb-subcategory');
        if (breadcrumbCategory) breadcrumbCategory.textContent = categoryName;
        if (breadcrumbSubcategory) breadcrumbSubcategory.textContent = subcatInfo.name;
        
        // Store current subcategory
        this.currentSubcategory = subcatKey;
        
        // Load collection data
        await this.loadCollectionDashboard(subcatKey);
    }
    
    async loadCollectionDashboard(subcatKey) {
        try {
            // Fetch all items for this subcategory
            const items = await ipcRenderer.invoke('db-query',
                'SELECT * FROM books WHERE subcategory = ? ORDER BY created_at DESC',
                [subcatKey]
            );
            
            // Calculate stats
            const stats = {
                total: items.length,
                completed: items.filter(i => i.status === 'completed').length,
                inProgress: items.filter(i => i.status === 'in-progress').length,
                wishlist: items.filter(i => i.status === 'wishlist').length,
                favorites: items.filter(i => i.rating === 5).length
            };
            
            // Update stat cards with contextual labels
            this.updateCollectionStats(subcatKey, stats);
            
            // Calculate completion percentage
            const completionPercent = stats.total > 0 ? (stats.completed / stats.total * 100) : 0;
            const progressBar = document.getElementById('progress-total');
            if (progressBar) progressBar.style.width = `${completionPercent}%`;
            
            // Render items in grid view (default)
            this.renderCollectionGrid(items);
            
            // Show/hide empty state
            const emptyState = document.getElementById('collection-empty');
            const viewContainer = document.querySelector('.collection-view-container');
            if (items.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                if (viewContainer) viewContainer.style.display = 'none';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (viewContainer) viewContainer.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error loading collection dashboard:', error);
        }
    }
    
    updateCollectionStats(subcatKey, stats) {
        // Update values
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-completed').textContent = stats.completed;
        document.getElementById('stat-in-progress').textContent = stats.inProgress;
        document.getElementById('stat-wishlist').textContent = stats.wishlist;
        document.getElementById('stat-favorites').textContent = stats.favorites;
        
        // Contextual labels based on subcategory type
        const labels = this.getContextualLabels(subcatKey);
        
        // Update labels
        const labelCompleted = document.getElementById('stat-label-completed');
        const labelInProgress = document.getElementById('stat-label-in-progress');
        const labelWishlist = document.getElementById('stat-label-wishlist');
        const sublabelCompleted = document.getElementById('stat-sublabel-completed');
        const sublabelInProgress = document.getElementById('stat-sublabel-in-progress');
        const sublabelWishlist = document.getElementById('stat-sublabel-wishlist');
        
        if (labelCompleted) labelCompleted.textContent = labels.completed;
        if (labelInProgress) labelInProgress.textContent = labels.inProgress;
        if (labelWishlist) labelWishlist.textContent = labels.wishlist;
        if (sublabelCompleted) sublabelCompleted.textContent = labels.completedSub;
        if (sublabelInProgress) sublabelInProgress.textContent = labels.inProgressSub;
        if (sublabelWishlist) sublabelWishlist.textContent = labels.wishlistSub;
    }
    
    getContextualLabels(subcatKey) {
        const labelMap = {
            'books': {
                completed: 'Books Read',
                completedSub: 'Finished & absorbed',
                inProgress: 'Currently Reading',
                inProgressSub: 'Pages turning',
                wishlist: 'Reading List',
                wishlistSub: 'To be discovered'
            },
            'movies': {
                completed: 'Movies Watched',
                completedSub: 'Lights, camera, enjoyed!',
                inProgress: 'Watching Now',
                inProgressSub: 'Popcorn ready',
                wishlist: 'Watch List',
                wishlistSub: 'Coming attractions'
            },
            'shows': {
                completed: 'Series Completed',
                completedSub: 'Binge-watched',
                inProgress: 'Currently Watching',
                inProgressSub: 'Episode by episode',
                wishlist: 'To Binge',
                wishlistSub: 'Queued up'
            },
            'music': {
                completed: 'Albums Explored',
                completedSub: 'On repeat',
                inProgress: 'Discovering Now',
                inProgressSub: 'In rotation',
                wishlist: 'To Listen',
                wishlistSub: 'New sounds await'
            },
            'restaurants': {
                completed: 'Places Visited',
                completedSub: 'Delicious memories',
                inProgress: 'Planning Visit',
                inProgressSub: 'Reservation pending',
                wishlist: 'Want to Try',
                wishlistSub: 'Taste adventure awaits'
            },
            'courses': {
                completed: 'Courses Completed',
                completedSub: 'Knowledge gained',
                inProgress: 'Learning Now',
                inProgressSub: 'Lessons in progress',
                wishlist: 'Want to Learn',
                wishlistSub: 'Skills to acquire'
            },
            'games': {
                completed: 'Games Completed',
                completedSub: 'Victory achieved',
                inProgress: 'Playing Now',
                inProgressSub: 'Level up',
                wishlist: 'To Play',
                wishlistSub: 'Next adventure'
            }
        };
        
        return labelMap[subcatKey] || {
            completed: 'Experienced',
            completedSub: 'Completed & enjoyed',
            inProgress: 'Currently Exploring',
            inProgressSub: 'Active right now',
            wishlist: 'Want to Experience',
            wishlistSub: 'On your radar'
        };
    }
    
    renderCollectionGrid(items) {
        const gridContainer = document.getElementById('collection-grid');
        if (!gridContainer) return;
        
        if (items.length === 0) {
            gridContainer.innerHTML = '';
            return;
        }
        
        gridContainer.innerHTML = items.map(item => `
            <div class="collection-card" data-id="${item.id}">
                <div class="card-cover">
                    ${item.cover_url ? `<img src="${item.cover_url}" alt="${this.escapeHtml(item.title)}">` : 
                      `<div class="card-cover-placeholder">${this.getItemIcon(item)}</div>`}
                    <div class="card-status-badge status-${item.status || 'wishlist'}">${this.getStatusLabel(item.status)}</div>
                </div>
                <div class="card-body">
                    <h4 class="card-title">${this.escapeHtml(item.title || 'Untitled')}</h4>
                    <p class="card-meta">${this.escapeHtml(item.author || item.creator || '')}</p>
                    ${item.rating ? `<div class="card-rating">${'⭐'.repeat(item.rating)}</div>` : ''}
                    ${item.year ? `<div class="card-year">${item.year}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="app.viewItem(${item.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="card-action-btn" onclick="app.editItem(${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-btn" onclick="app.deleteItem(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getItemIcon(item) {
        // Return appropriate emoji based on item type
        const icons = {
            'books': '📚',
            'movies': '🎬',
            'shows': '📺',
            'music': '🎵',
            'articles': '📰',
            'podcasts': '🎙️',
            'restaurants': '🍽️',
            'recipes': '🍳'
        };
        return icons[this.currentSubcategory] || '📝';
    }
    
    getStatusLabel(status) {
        const labels = {
            'completed': 'Completed',
            'in-progress': 'In Progress',
            'wishlist': 'Wishlist',
            'read': 'Read',
            'watched': 'Watched',
            'listening': 'Listening'
        };
        return labels[status] || 'Wishlist';
    }
    
    async loadSubcategoryItems(subcatKey) {
        const container = document.getElementById('subcategory-items-list');
        if (!container) return;
        
        try {
            const items = await ipcRenderer.invoke('db-query',
                'SELECT * FROM books WHERE subcategory = ? ORDER BY created_at DESC',
                [subcatKey]
            );
            
            if (items.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No items yet</div>';
                return;
            }
            
            container.innerHTML = items.map(item => `
                <div class="simple-item" data-item-id="${item.id}">
                    <div class="simple-item-title">${item.title || 'Untitled'}</div>
                    <div class="simple-item-meta">
                        ${item.author || 'Unknown'} ${item.year ? `• ${item.year}` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading subcategory items:', error);
            container.innerHTML = '<div style="text-align: center; color: #ef4444;">Error loading items</div>';
        }
    }
    
    loadSubcategoryPills(category) {
        const container = document.getElementById('subcategory-pills');
        if (!container) return;
        
        const subcats = this.subcategories[category] || {};
        container.innerHTML = Object.keys(subcats).map(key => `
            <button class="pill-btn" data-subcategory="${key}">
                ${subcats[key].name}
            </button>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.pill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.subcategories-pills .pill-btn[data-subcategory="all"]').classList.remove('active');
                e.currentTarget.classList.add('active');
                this.currentSubcategory = e.currentTarget.dataset.subcategory;
                this.refreshCategoryView();
            });
        });
    }
    
    getCategoryInfo(category) {
        const info = {
            intellectual: {
                title: 'Intellectual',
                description: 'Books, courses, research, and knowledge that expands your mind'
            },
            emotional: {
                title: 'Emotional',
                description: 'Music, movies, art, and experiences that touch your heart'
            },
            physical: {
                title: 'Physical',
                description: 'Workouts, sports, nutrition, and activities for your body'
            },
            professional: {
                title: 'Professional',
                description: 'Career development, business knowledge, and professional growth'
            },
            beyond: {
                title: 'Beyond',
                description: 'Meditation, spirituality, and transcendent experiences'
            }
        };
        return info[category] || { title: category, description: '' };
    }
    
    loadDashboardStats() {
        // Legacy method - redirect to enhanced dashboard
        this.loadEnhancedDashboard();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CerebralApp();
});
