const mobileToggle = document.querySelector(".mobile-toggle");
const primaryNav = document.getElementById("primary-nav");

if (mobileToggle && primaryNav) {
  mobileToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("open");
    mobileToggle.setAttribute("aria-expanded", isOpen);
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (primaryNav.classList.contains("open")) {
        primaryNav.classList.remove("open");
        mobileToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function switchContactTab(type) {
  const tabEmail = document.getElementById("tab-email");
  const tabCall = document.getElementById("tab-call");
  const phoneGroup = document.getElementById("phone-group");
  const phoneInput = document.getElementById("c-phone");
  const messageLabel = document.getElementById("message-label");
  const messageInput = document.getElementById("c-message");
  const submitText = document.getElementById("submit-text");
  const disclaimerBtn = document.getElementById("disclaimer-btn-name");

  if (!tabEmail || !tabCall) return;

  if (type === "call") {
    tabEmail.classList.remove("active");
    tabEmail.setAttribute("aria-selected", "false");
    tabCall.classList.add("active");
    tabCall.setAttribute("aria-selected", "true");

    if (phoneGroup) phoneGroup.style.display = "block";
    if (phoneInput) phoneInput.required = true;
    if (messageLabel) messageLabel.textContent = "Preferred time & call details";
    if (messageInput) messageInput.placeholder = "Tell us your preferred day/time to call and any details...";
    if (submitText) submitText.textContent = "Request a call";
    if (disclaimerBtn) disclaimerBtn.textContent = '“Request a call”';
  } else {
    tabCall.classList.remove("active");
    tabCall.setAttribute("aria-selected", "false");
    tabEmail.classList.add("active");
    tabEmail.setAttribute("aria-selected", "true");

    if (phoneGroup) phoneGroup.style.display = "none";
    if (phoneInput) phoneInput.required = false;
    if (messageLabel) messageLabel.textContent = "How can we help?";
    if (messageInput) messageInput.placeholder = "Tell us a little about how we can support you...";
    if (submitText) submitText.textContent = "Send message";
    if (disclaimerBtn) disclaimerBtn.textContent = '“Send message”';
  }
}

import { getEvents, getNews } from './supabase-init.js';

async function renderLiveEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;
  container.innerHTML = `<p style="grid-column: 1/-1; color: #6b7370; text-align: center; font-style: italic;">Loading schedule...</p>`;

  try {
    const events = await getEvents();
    if (!events || events.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; color: #6b7370; text-align: center;">No upcoming events scheduled right now. Check back soon!</p>`;
      return;
    }

    container.innerHTML = events.map(evt => `
      <div class="event-card">
        <span class="status-pill ${evt.statusClass || 'status-ongoing'}">${escapeSafe(evt.status)}</span>
        <h3>${escapeSafe(evt.title)}</h3>
        <p>${escapeSafe(evt.desc)}</p>
        <p class="form-note">Date: ${escapeSafe(evt.date)}</p>
        <a class="btn btn-outline" href="${evt.linkUrl || '#contact'}">${escapeSafe(evt.linkText || 'Register interest')}</a>
      </div>
    `).join('');
  } catch (e) {
    console.error("Firebase load err", e);
    container.innerHTML = `<p style="grid-column: 1/-1; color: red;">Error loading events.</p>`;
  }
}

async function renderLiveNews() {
  const container = document.getElementById("news-container");
  if (!container) return;
  container.innerHTML = `<p style="grid-column: 1/-1; color: #6b7370; text-align: center; font-style: italic;">Loading community news...</p>`;

  try {
    const news = await getNews();
    if (!news || news.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; color: #6b7370; text-align: center;">No news stories published yet.</p>`;
      return;
    }

    container.innerHTML = news.map(item => `
      <article class="update-card">
        ${item.image ? `<img src="${item.image}" alt="${escapeSafe(item.title)}" style="width:100%; height:160px; object-fit:cover; border-radius:12px; margin-bottom:12px;" />` : `<div class="photo-placeholder">${escapeSafe(item.caption || 'Photo placeholder — community update')}</div>`}
        <span class="u-date">${escapeSafe(item.date)}</span>
        <h4>${escapeSafe(item.title)}</h4>
      </article>
    `).join('');
  } catch (e) {
    console.error("Firebase load err", e);
    container.innerHTML = `<p style="grid-column: 1/-1; color: red;">Error loading news.</p>`;
  }
}

function escapeSafe(str) {
  return (str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderLiveEvents();
  renderLiveNews();
  
  // ── Contact Form integration with Cloud Function ──
  const contactForm = document.getElementById("contactFm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector(".contact-submit-btn");
      const btnText = document.getElementById("submit-text");
      const originalText = btnText.textContent;
      
      btnText.textContent = "Sending...";
      submitBtn.disabled = true;
      
      const formData = new FormData(contactForm);
      const isCall = document.getElementById("tab-call").classList.contains("active");
      
      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone") || "",
        message: formData.get("message"),
        type: isCall ? "call" : "email"
      };

      try {
        // Calling a Netlify Function we will create for email sending:
        const response = await fetch("/.netlify/functions/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || "Failed to send");
        
        alert("Thank you! Your message has been sent successfully.");
        contactForm.reset();
        
      } catch (err) {
        console.error("Form error:", err);
        alert("Sorry, there was an error sending your message. Please try again or email us directly at info@hersocialnetworkcic.uk");
      } finally {
        btnText.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
