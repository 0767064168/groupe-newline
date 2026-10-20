/* ========================================
   GroupeNewline – Advanced Animations JS
   Dynamic Effects & Interactions
   ======================================== */

(function() {
  'use strict';

  // ========================================
  // SCROLL TRIGGER SYSTEM
  // ========================================

  const ScrollTrigger = {
    triggers: [],
    
    init() {
      this.setupScrollTriggers();
      this.observeElements();
    },

    setupScrollTriggers() {
      // Add scroll trigger classes to elements
      const elements = document.querySelectorAll('.service-card, .testi-card, .blog-card, .hero-btns a, .section-title');
      
      elements.forEach((el, index) => {
        el.classList.add('scroll-trigger');
        
        // Alternate animation directions for visual interest
        const directions = ['slide-left', 'slide-right', 'slide-up', 'scale-up'];
        const direction = directions[index % directions.length];
        el.setAttribute('data-animation', direction);
        
        this.triggers.push(el);
      });
    },

    observeElements() {
      const options = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const direction = entry.target.getAttribute('data-animation') || 'slide-up';
            entry.target.classList.add(direction, 'visible');
            observer.unobserve(entry.target);
          }
        });
      }, options);

      this.triggers.forEach(trigger => observer.observe(trigger));
    }
  };

  // ========================================
  // BUTTON ANIMATIONS
  // ========================================

  const ButtonAnimations = {
    init() {
      this.setupButtonEffects();
      this.addHoverAnimations();
    },

    setupButtonEffects() {
      const buttons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-gold');
      
      buttons.forEach((btn, index) => {
        btn.classList.add('anim-active');
        
        // Alternate button animations
        const animations = ['anim-btn-pulse', 'anim-btn-glow', 'anim-btn-neon'];
        const shouldAnimate = index % 3 === 0;
        
        if (shouldAnimate) {
          btn.classList.add(animations[index % animations.length]);
        }

        // Add ripple effect on click
        btn.addEventListener('click', (e) => {
          this.createRipple(e, btn);
        });

        // Add lift effect on hover
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-4px) scale(1.05)';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0) scale(1)';
        });
      });
    },

    createRipple(e, button) {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      // Remove existing ripples
      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) existingRipple.remove();

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },

    addHoverAnimations() {
      const buttons = document.querySelectorAll('.nav-cta, .btn-primary, .btn-outline');
      
      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
          this.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
      });
    }
  };

  // ========================================
  // TEXT ANIMATIONS
  // ========================================

  const TextAnimations = {
    init() {
      this.animateHeroTitle();
      this.animateSectionTitles();
    },

    animateHeroTitle() {
      const title = document.querySelector('.hero-title');
      if (!title) return;

      title.classList.add('anim-slide-up');
      
      // Add glow effect to span inside title
      const goldSpan = title.querySelector('span');
      if (goldSpan) {
        goldSpan.classList.add('anim-text-glow');
      }
    },

    animateSectionTitles() {
      const titles = document.querySelectorAll('.section-title');
      titles.forEach((title, index) => {
        setTimeout(() => {
          title.classList.add('anim-slide-left');
        }, index * 100);
      });
    }
  };

  // ========================================
  // CARD ANIMATIONS
  // ========================================

  const CardAnimations = {
    init() {
      this.setupCardEffects();
    },

    setupCardEffects() {
      const cards = document.querySelectorAll('.service-card, .testi-card, .blog-card');
      
      cards.forEach((card, index) => {
        // Add stagger animation class
        card.classList.add('anim-stagger');
        card.style.animationDelay = (index * 0.1) + 's';

        // Add hover effect
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-12px) scale(1.02) rotateX(5deg)';
          card.style.boxShadow = '0 25px 60px rgba(212, 175, 55, 0.2)';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
          card.style.boxShadow = '';
        });
      });
    }
  };

  // ========================================
  // NAVBAR ANIMATIONS
  // ========================================

  const NavbarAnimations = {
    init() {
      this.animateNavbar();
      this.animateNavLinks();
    },

    animateNavbar() {
      const navbar = document.getElementById('navbar');
      let lastScrollTop = 0;

      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        
        if (navbar) {
          if (scrollTop > 100) {
            navbar.style.transform = 'translateY(-5px)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
          } else {
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = '';
          }
        }
        
        lastScrollTop = scrollTop;
      });
    },

    animateNavLinks() {
      const links = document.querySelectorAll('.nav-links a');
      
      links.forEach((link, index) => {
        link.style.position = 'relative';
        
        link.addEventListener('mouseenter', function() {
          this.style.color = 'var(--gold)';
          this.style.transform = 'translateY(-2px)';
          this.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });

        link.addEventListener('mouseleave', function() {
          this.style.color = '';
          this.style.transform = 'translateY(0)';
        });
      });
    }
  };

  // ========================================
  // PARALLAX EFFECT (SUBTLE)
  // ========================================

  const ParallaxEffect = {
    init() {
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
          heroBg.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
      });
    }
  };

  // ========================================
  // COUNTER ANIMATION (ENHANCED)
  // ========================================

  const CounterAnimation = {
    init() {
      this.observeCounters();
    },

    observeCounters() {
      const counters = document.querySelectorAll('[data-count]');
      const options = {
        threshold: 0.5
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count);
            
            el.parentElement.classList.add('anim-slide-up');
            this.animateNumber(el, target);
            observer.unobserve(el);
          }
        });
      }, options);

      counters.forEach(counter => observer.observe(counter));
    },

    animateNumber(el, target) {
      let current = 0;
      const increment = target / 60;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 30);
    }
  };

  // ========================================
  // GALLERY ANIMATIONS
  // ========================================

  const GalleryAnimations = {
    init() {
      this.setupGalleryEffects();
    },

    setupGalleryEffects() {
      const items = document.querySelectorAll('.gallery-item');
      
      items.forEach((item, index) => {
        item.classList.add('anim-stagger');
        item.style.animationDelay = (index * 0.08) + 's';

        // Add zoom effect on hover
        item.addEventListener('mouseenter', function() {
          this.querySelector('img').style.transform = 'scale(1.15) rotate(2deg)';
          this.querySelector('img').style.filter = 'brightness(0.8)';
        });

        item.addEventListener('mouseleave', function() {
          this.querySelector('img').style.transform = 'scale(1) rotate(0deg)';
          this.querySelector('img').style.filter = 'brightness(1)';
        });
      });
    }
  };

  // ========================================
  // HERO SECTION ANIMATIONS
  // ========================================

  const HeroAnimations = {
    init() {
      this.animateBadge();
      this.animateButtons();
      this.animateScrollIndicator();
    },

    animateBadge() {
      const badge = document.querySelector('.hero-badge');
      if (badge) {
        badge.classList.add('anim-fade-scale');
        badge.style.animationDelay = '0.2s';
      }
    },

    animateButtons() {
      const buttons = document.querySelectorAll('.hero-btns a');
      buttons.forEach((btn, index) => {
        btn.classList.add('anim-slide-up');
        btn.style.animationDelay = (0.3 + index * 0.15) + 's';
      });
    },

    animateScrollIndicator() {
      const indicator = document.querySelector('.scroll-indicator');
      if (indicator) {
        indicator.style.animation = 'bounce 2s infinite';
      }
    }
  };

  // ========================================
  // FORM ANIMATIONS
  // ========================================

  const FormAnimations = {
    init() {
      this.setupFormFields();
    },

    setupFormFields() {
      const inputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
      
      inputs.forEach((input, index) => {
        input.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

        input.addEventListener('focus', function() {
          this.style.borderColor = 'var(--gold)';
          this.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.3)';
          this.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function() {
          this.style.borderColor = '';
          this.style.boxShadow = '';
          this.style.transform = 'translateY(0)';
        });
      });
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  document.addEventListener('DOMContentLoaded', () => {
    ScrollTrigger.init();
    ButtonAnimations.init();
    TextAnimations.init();
    CardAnimations.init();
    NavbarAnimations.init();
    ParallaxEffect.init();
    CounterAnimation.init();
    GalleryAnimations.init();
    HeroAnimations.init();
    FormAnimations.init();
  });

})();
