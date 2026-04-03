/**
 * FlashMind - Automated Flashcard Maker
 * Main JavaScript Application
 * 
 * Features:
 * - Auto-generate flashcards from text
 * - Manual flashcard creation
 * - Study mode with progress tracking
 * - LocalStorage persistence
 * - Search and filter
 * - Dark mode toggle
 */

// ============================================
// State Management
// ============================================

let flashcards = [];
let currentStudyIndex = 0;
let studiedCount = 0;
let editCardId = null;

// ============================================
// DOM Elements
// ============================================

const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    autoTab: document.getElementById('autoTab'),
    manualTab: document.getElementById('manualTab'),
    
    // Inputs
    textInput: document.getElementById('textInput'),
    questionInput: document.getElementById('questionInput'),
    answerInput: document.getElementById('answerInput'),
    searchInput: document.getElementById('searchInput'),
    
    // Buttons
    generateBtn: document.getElementById('generateBtn'),
    addManualBtn: document.getElementById('addManualBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    studyModeBtn: document.getElementById('studyModeBtn'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Grid & Stats
    flashcardsGrid: document.getElementById('flashcardsGrid'),
    emptyState: document.getElementById('emptyState'),
    totalCards: document.getElementById('totalCards'),
    studiedCards: document.getElementById('studiedCards'),
    progressPercent: document.getElementById('progressPercent'),
    
    // Study Modal
    studyModal: document.getElementById('studyModal'),
    closeStudyBtn: document.getElementById('closeStudyBtn'),
    studyFlashcard: document.getElementById('studyFlashcard'),
    studyQuestion: document.getElementById('studyQuestion'),
    studyAnswer: document.getElementById('studyAnswer'),
    prevCardBtn: document.getElementById('prevCardBtn'),
    nextCardBtn: document.getElementById('nextCardBtn'),
    flipCardBtn: document.getElementById('flipCardBtn'),
    markKnownBtn: document.getElementById('markKnownBtn'),
    markUnknownBtn: document.getElementById('markUnknownBtn'),
    studyProgressFill: document.getElementById('studyProgressFill'),
    studyProgressText: document.getElementById('studyProgressText'),
    
    // Edit Modal
    editModal: document.getElementById('editModal'),
    closeEditBtn: document.getElementById('closeEditBtn'),
    editQuestion: document.getElementById('editQuestion'),
    editAnswer: document.getElementById('editAnswer'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadFlashcards();
    loadTheme();
    renderFlashcards();
    updateStats();
    setupEventListeners();
});

// ============================================
// Event Listeners Setup
// ============================================

function setupEventListeners() {
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Generate flashcards
    elements.generateBtn.addEventListener('click', generateFlashcards);
    
    // Manual add
    elements.addManualBtn.addEventListener('click', addManualFlashcard);
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        renderFlashcards(e.target.value);
    });
    
    // Shuffle
    elements.shuffleBtn.addEventListener('click', shuffleFlashcards);
    
    // Study mode
    elements.studyModeBtn.addEventListener('click', openStudyMode);
    elements.closeStudyBtn.addEventListener('click', closeStudyMode);
    elements.studyFlashcard.addEventListener('click', flipStudyCard);
    elements.prevCardBtn.addEventListener('click', () => navigateStudyCard(-1));
    elements.nextCardBtn.addEventListener('click', () => navigateStudyCard(1));
    elements.flipCardBtn.addEventListener('click', flipStudyCard);
    elements.markKnownBtn.addEventListener('click', () => markCardAsStudied(true));
    elements.markUnknownBtn.addEventListener('click', () => markCardAsStudied(false));
    
    // Edit modal
    elements.closeEditBtn.addEventListener('click', closeEditModal);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.saveEditBtn.addEventListener('click', saveEdit);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeStudyMode();
                closeEditModal();
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (elements.studyModal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') navigateStudyCard(-1);
            if (e.key === 'ArrowRight') navigateStudyCard(1);
            if (e.key === ' ' || e.key === 'Enter') flipStudyCard();
            if (e.key === 'Escape') closeStudyMode();
        }
    });
}

// ============================================
// Tab Switching
// ============================================

function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    elements.autoTab.classList.toggle('active', tabName === 'auto');
    elements.manualTab.classList.toggle('active', tabName === 'manual');
}

// ============================================
// Flashcard Generation
// ============================================

function generateFlashcards() {
    const text = elements.textInput.value.trim();
    
    if (!text) {
        showToast('Please enter some text to generate flashcards');
        return;
    }
    
    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
        showToast('No valid sentences found. Please enter more detailed text.');
        return;
    }
    
    let generatedCount = 0;
    
    sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length < 15) return;
        
        // Try to identify key terms and create Q&A pairs
        const flashcard = createFlashcardFromSentence(trimmed);
        if (flashcard) {
            flashcards.push(flashcard);
            generatedCount++;
        }
    });
    
    if (generatedCount > 0) {
        saveFlashcards();
        renderFlashcards();
        updateStats();
        elements.textInput.value = '';
        showToast(`Generated ${generatedCount} flashcard${generatedCount > 1 ? 's' : ''}!`);
    } else {
        showToast('Could not generate flashcards. Try different text.');
    }
}

function createFlashcardFromSentence(sentence) {
    // Pattern matching for common educational statements
    
    // Pattern 1: "X is Y" format
    const isPattern = /^([A-Z][^.]*?)\s+(?:is|are|was|were)\s+(.+)$/i;
    const isMatch = sentence.match(isPattern);
    if (isMatch) {
        return {
            id: Date.now() + Math.random(),
            question: `What is ${isMatch[1].trim()}?`,
            answer: isMatch[2].trim() + '.',
            created: new Date().toISOString(),
            studied: false
        };
    }
    
    // Pattern 2: "X does Y" or "X can Y" format
    const doesPattern = /^([A-Z][^.]*?)\s+(?:does|can|will|may)\s+(.+)$/i;
    const doesMatch = sentence.match(doesPattern);
    if (doesMatch) {
        return {
            id: Date.now() + Math.random(),
            question: `What does ${doesMatch[1].trim()} do?`,
            answer: doesMatch[2].trim() + '.',
            created: new Date().toISOString(),
            studied: false
        };
    }
    
    // Pattern 3: Contains numbers (facts with data)
    const numberPattern = /(\d+(?:\.\d+)?(?:\s*(?:%|degrees|°|km|m|kg|g|lbs|hours|years))?)/i;
    const numberMatch = sentence.match(numberPattern);
    if (numberMatch) {
        const number = numberMatch[1];
        return {
            id: Date.now() + Math.random(),
            question: `${sentence.replace(number, '___')}?`,
            answer: sentence,
            created: new Date().toISOString(),
            studied: false
        };
    }
    
    // Pattern 4: Generic - use first part as question hint
    const words = sentence.split(' ');
    if (words.length > 5) {
        const firstPart = words.slice(0, Math.floor(words.length / 2)).join(' ');
        return {
            id: Date.now() + Math.random(),
            question: `Tell me about: ${firstPart}...`,
            answer: sentence,
            created: new Date().toISOString(),
            studied: false
        };
    }
    
    // Fallback: Use entire sentence as answer, create generic question
    return {
        id: Date.now() + Math.random(),
        question: `Explain: ${sentence.substring(0, 30)}...`,
        answer: sentence,
        created: new Date().toISOString(),
        studied: false
    };
}

// ============================================
// Manual Flashcard Creation
// ============================================

function addManualFlashcard() {
    const question = elements.questionInput.value.trim();
    const answer = elements.answerInput.value.trim();
    
    if (!question || !answer) {
        showToast('Please fill in both question and answer fields');
        return;
    }
    
    const flashcard = {
        id: Date.now(),
        question,
        answer,
        created: new Date().toISOString(),
        studied: false
    };
    
    flashcards.push(flashcard);
    saveFlashcards();
    renderFlashcards();
    updateStats();
    
    elements.questionInput.value = '';
    elements.answerInput.value = '';
    
    showToast('Flashcard added successfully!');
}

// ============================================
// Render Flashcards
// ============================================

function renderFlashcards(searchTerm = '') {
    const filtered = flashcards.filter(card => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return card.question.toLowerCase().includes(term) || 
               card.answer.toLowerCase().includes(term);
    });
    
    if (filtered.length === 0) {
        elements.flashcardsGrid.innerHTML = '';
        elements.emptyState.classList.add('show');
        return;
    }
    
    elements.emptyState.classList.remove('show');
    elements.flashcardsGrid.innerHTML = filtered.map(card => createFlashcardHTML(card)).join('');
    
    // Add click listeners to cards
    document.querySelectorAll('.flashcard-inner').forEach(inner => {
        inner.addEventListener('click', (e) => {
            // Don't flip if clicking action buttons
            if (!e.target.closest('.flashcard-actions')) {
                inner.classList.toggle('flipped');
            }
        });
    });
    
    // Add action button listeners
    document.querySelectorAll('.flashcard-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(parseFloat(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.flashcard-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFlashcard(parseFloat(btn.dataset.id));
        });
    });
}

function createFlashcardHTML(card) {
    return `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <span class="card-label">Question</span>
                    <p class="card-text">${escapeHTML(card.question)}</p>
                    <div class="flashcard-actions">
                        <button class="flashcard-action-btn edit" data-id="${card.id}" title="Edit">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="flashcard-action-btn delete" data-id="${card.id}" title="Delete">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
                <div class="flashcard-back">
                    <span class="card-label">Answer</span>
                    <p class="card-text">${escapeHTML(card.answer)}</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Flashcard Operations
// ============================================

function deleteFlashcard(id) {
    if (confirm('Are you sure you want to delete this flashcard?')) {
        flashcards = flashcards.filter(card => card.id !== id);
        saveFlashcards();
        renderFlashcards(elements.searchInput.value);
        updateStats();
        showToast('Flashcard deleted');
    }
}

function shuffleFlashcards() {
    for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }
    saveFlashcards();
    renderFlashcards(elements.searchInput.value);
    showToast('Flashcards shuffled!');
}

// ============================================
// Edit Functionality
// ============================================

function openEditModal(id) {
    const card = flashcards.find(c => c.id === id);
    if (!card) return;
    
    editCardId = id;
    elements.editQuestion.value = card.question;
    elements.editAnswer.value = card.answer;
    elements.editModal.classList.add('show');
}

function closeEditModal() {
    elements.editModal.classList.remove('show');
    editCardId = null;
}

function saveEdit() {
    const question = elements.editQuestion.value.trim();
    const answer = elements.editAnswer.value.trim();
    
    if (!question || !answer) {
        showToast('Please fill in both fields');
        return;
    }
    
    const card = flashcards.find(c => c.id === editCardId);
    if (card) {
        card.question = question;
        card.answer = answer;
        saveFlashcards();
        renderFlashcards(elements.searchInput.value);
        closeEditModal();
        showToast('Flashcard updated!');
    }
}

// ============================================
// Study Mode
// ============================================

function openStudyMode() {
    if (flashcards.length === 0) {
        showToast('Add some flashcards first!');
        return;
    }
    
    currentStudyIndex = 0;
    elements.studyModal.classList.add('show');
    loadStudyCard();
}

function closeStudyMode() {
    elements.studyModal.classList.remove('show');
    // Reset flip state
    const inner = elements.studyFlashcard.querySelector('.study-card-inner');
    if (inner) inner.classList.remove('flipped');
}

function loadStudyCard() {
    if (flashcards.length === 0) return;
    
    const card = flashcards[currentStudyIndex];
    const inner = elements.studyFlashcard.querySelector('.study-card-inner');
    
    // Reset flip state
    inner.classList.remove('flipped');
    
    // Update content after a brief delay to allow flip animation
    setTimeout(() => {
        elements.studyQuestion.textContent = card.question;
        elements.studyAnswer.textContent = card.answer;
        
        // Update progress
        const progress = ((currentStudyIndex + 1) / flashcards.length) * 100;
        elements.studyProgressFill.style.width = `${progress}%`;
        elements.studyProgressText.textContent = `Card ${currentStudyIndex + 1} of ${flashcards.length}`;
        
        // Update button states
        elements.prevCardBtn.disabled = currentStudyIndex === 0;
        elements.nextCardBtn.disabled = currentStudyIndex === flashcards.length - 1;
    }, 150);
}

function flipStudyCard() {
    const inner = elements.studyFlashcard.querySelector('.study-card-inner');
    inner.classList.toggle('flipped');
}

function navigateStudyCard(direction) {
    const newIndex = currentStudyIndex + direction;
    if (newIndex >= 0 && newIndex < flashcards.length) {
        currentStudyIndex = newIndex;
        loadStudyCard();
    }
}

function markCardAsStudied(known) {
    flashcards[currentStudyIndex].studied = known;
    studiedCount = flashcards.filter(c => c.studied).length;
    saveFlashcards();
    updateStats();
    
    if (known) {
        showToast('Marked as known! ✓');
    }
    
    // Auto-advance
    if (currentStudyIndex < flashcards.length - 1) {
        setTimeout(() => navigateStudyCard(1), 300);
    } else {
        showToast('Completed all cards! 🎉');
    }
}

// ============================================
// LocalStorage
// ============================================

function saveFlashcards() {
    localStorage.setItem('flashmind_cards', JSON.stringify(flashcards));
    localStorage.setItem('flashmind_studied', studiedCount.toString());
}

function loadFlashcards() {
    const saved = localStorage.getItem('flashmind_cards');
    if (saved) {
        flashcards = JSON.parse(saved);
    }
    
    const savedStudied = localStorage.getItem('flashmind_studied');
    if (savedStudied) {
        studiedCount = parseInt(savedStudied, 10);
    }
}

// ============================================
// Stats Update
// ============================================

function updateStats() {
    elements.totalCards.textContent = flashcards.length;
    elements.studiedCards.textContent = studiedCount;
    const percent = flashcards.length > 0 
        ? Math.round((studiedCount / flashcards.length) * 100) 
        : 0;
    elements.progressPercent.textContent = `${percent}%`;
}

// ============================================
// Theme Management
// ============================================

function loadTheme() {
    const savedTheme = localStorage.getItem('flashmind_theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('flashmind_theme', 'light');
        updateThemeIcon(false);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('flashmind_theme', 'dark');
        updateThemeIcon(true);
    }
}

function updateThemeIcon(isDark) {
    const icon = elements.themeToggle.querySelector('.material-symbols-outlined');
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message) {
    const toastMessage = elements.toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Utility Functions
// ============================================

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// Sample Data (for demo purposes)
// ============================================

function loadSampleData() {
    if (flashcards.length === 0) {
        flashcards = [
            {
                id: 1,
                question: "What is photosynthesis?",
                answer: "Photosynthesis is the process by which plants convert light energy into chemical energy, producing glucose and oxygen from carbon dioxide and water.",
                created: new Date().toISOString(),
                studied: false
            },
            {
                id: 2,
                question: "What is the powerhouse of the cell?",
                answer: "The mitochondria is known as the powerhouse of the cell because it generates most of the cell's supply of ATP (adenosine triphosphate).",
                created: new Date().toISOString(),
                studied: false
            },
            {
                id: 3,
                question: "At what temperature does water boil at sea level?",
                answer: "Water boils at 100 degrees Celsius (212 degrees Fahrenheit) at sea level.",
                created: new Date().toISOString(),
                studied: false
            }
        ];
        saveFlashcards();
        renderFlashcards();
        updateStats();
    }
}

// Load sample data on first visit for better UX
loadSampleData();
