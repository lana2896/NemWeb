import LanguageManager from './lang.js';
import API from './api.js';

/**
 * App Class
 * Main controller for the Quán Nem website.
 */
class App {
    constructor() {
        this.langManager = new LanguageManager();
        this.init();
    }

    async init() {
        // 1. Initialize Language System
        await this.langManager.init();
        this.setupEventListeners();

        // 2. Load Reviews via API
        this.loadReviews();

        // 3. Setup Sticky Header
        this.setupStickyHeader();
    }

    setupEventListeners() {
        // Language Toggle
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.langManager.toggleLanguage();
                this.renderReviews(this.reviewsData);
            });
        }

        // Mobile Menu
        const hamburger = document.querySelector('.hamburger');
        const navbar = document.querySelector('.navbar');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navbar.classList.toggle('active');
            });
        }

        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navbar) navbar.classList.remove('active');
        }));

        // Reservation Form
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleReservation(e));
        }

        // Review Form
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));
        }
    }

    setupStickyHeader() {
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    async loadReviews() {
        const container = document.querySelector('.reviews-grid');
        if (container) {
            container.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--color-primary);"></i><p style="margin-top:10px;">Loading reviews...</p></div>';
        }

        try {
            // Use API to get mixed static + local reviews
            this.reviewsData = await API.get('reviews');
            this.renderReviews(this.reviewsData);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            if (container) container.innerHTML = '<p class="text-center">Could not load reviews.</p>';
        }
    }

    renderReviews(reviews) {
        if (!reviews) return;

        const container = document.querySelector('.reviews-grid');
        if (!container) return;

        const currentLang = this.langManager.currentLang; // 'vi' or 'en'

        container.innerHTML = reviews.map(review => {
            // Handle both structure types (dual lang from JSON or single lang from User)
            const comment = review[`comment_${currentLang}`] || review.comment || review.comment_vi;

            return `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-author">
                        <h4>${review.name}</h4>
                        <span class="review-source"><i class="fab fa-google"></i> ${review.source || 'Website'}</span>
                    </div>
                    <div class="review-rating">
                        ${this.generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-body">
                    <p>"${comment}"</p>
                </div>
            </div>
            `;
        }).join('');
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < rating) {
                stars += '<i class="fas fa-star" style="color: var(--color-accent);"></i>';
            } else {
                stars += '<i class="far fa-star" style="color: #ccc;"></i>';
            }
        }
        return stars;
    }

    async handleReservation(e) {
        e.preventDefault();
        console.log('Handling reservation submission...');

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            guests: document.getElementById('guests').value
        };

        try {
            console.log('Sending data to API:', formData);
            // Use API to save data
            await API.post('reservations', formData);

            const msg = this.langManager.currentLang === 'vi'
                ? `Cảm ơn ${formData.name}! Đặt bàn của bạn đã được ghi nhận.`
                : `Thank you ${formData.name}! Your reservation has been received.`;

            alert(msg);
            e.target.reset();
        } catch (error) {
            console.error('Reservation Error:', error);
            alert('Error sending reservation. Please try again.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Posting...';
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('review-name').value,
            rating: parseInt(document.getElementById('review-rating').value),
            comment: document.getElementById('review-comment').value,
            source: 'Website Local'
        };

        try {
            await API.post('reviews', formData);

            // Reload reviews to show the new one
            await this.loadReviews();

            const msg = this.langManager.currentLang === 'vi' ? 'Cảm ơn đánh giá của bạn!' : 'Thank you for your review!';
            alert(msg);
            e.target.reset();
        } catch (error) {
            console.error(error);
            alert('Error submitting review');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
