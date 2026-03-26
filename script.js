// !Blood Mockups - Interactive Navigation

// Show screen function
function showScreen(screenId) {
  // Hide all screens
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
  }

  // Update nav buttons
  const navButtons = document.querySelectorAll(
    ".mockup-nav .nav-buttons button",
  );
  navButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.toLowerCase().includes(screenId.split("-")[0])) {
      btn.classList.add("active");
    }
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Add click handlers for blood type options
  const bloodOptions = document.querySelectorAll(".blood-option");
  bloodOptions.forEach((option) => {
    option.addEventListener("click", () => {
      bloodOptions.forEach(
        (opt) => (opt.querySelector("input").checked = false),
      );
      option.querySelector("input").checked = true;
    });
  });

  // Add click handlers for urgency options
  const urgencyOptions = document.querySelectorAll(".urgency-option");
  urgencyOptions.forEach((option) => {
    option.addEventListener("click", () => {
      urgencyOptions.forEach(
        (opt) => (opt.querySelector("input").checked = false),
      );
      option.querySelector("input").checked = true;
    });
  });

  // Add click handlers for user type options
  const typeOptions = document.querySelectorAll(".type-option");
  typeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      typeOptions.forEach((opt) => {
        opt.classList.remove("active");
        opt.querySelector("input").checked = false;
      });
      option.classList.add("active");
      option.querySelector("input").checked = true;
    });
  });

  // Units selector
  const unitBtns = document.querySelectorAll(".unit-btn");
  const unitsValue = document.querySelector(".units-value");
  if (unitBtns.length && unitsValue) {
    let units = 2;
    unitBtns[0].addEventListener("click", () => {
      if (units > 1) {
        units--;
        unitsValue.textContent = units;
      }
    });
    unitBtns[1].addEventListener("click", () => {
      if (units < 10) {
        units++;
        unitsValue.textContent = units;
      }
    });
  }

  // Filter chips
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Toggle password visibility
  const toggleBtns = document.querySelectorAll(".toggle-pass");
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  // Character counter for textarea
  const textarea = document.querySelector("textarea");
  const charCount = document.querySelector(".char-count");
  if (textarea && charCount) {
    textarea.addEventListener("input", () => {
      const count = textarea.value.length;
      charCount.textContent = `${count}/200`;
      if (count > 200) {
        charCount.style.color = "#F44336";
      } else {
        charCount.style.color = "";
      }
    });
  }

  console.log("!Blood Mockups loaded successfully");

  // Star rating system
  initStarRating();
});

// ─── Urgency Modal ───────────────────────────────────────────────
function checkUrgency(label) {
  // Show warning modal when clicking "Urgente"
  const radio = label.querySelector('input[type="radio"]');
  if (radio) {
    showModal("urgency-modal");
    radio.checked = false; // prevent selection until confirmed
  }
}

function confirmUrgency() {
  // User confirmed urgency
  const urgentRadio = document
    .querySelector(".urgency-card.high")
    ?.closest(".urgency-option")
    ?.querySelector("input");
  if (urgentRadio) urgentRadio.checked = true;
  closeModal("urgency-modal");
}

function changeUrgency() {
  // User chose to use medium urgency instead
  const mediumRadio = document
    .querySelector(".urgency-card.medium")
    ?.closest(".urgency-option")
    ?.querySelector("input");
  if (mediumRadio) mediumRadio.checked = true;
  closeModal("urgency-modal");
}

// ─── Modal helpers ───────────────────────────────────────────────
function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

// Close modals when clicking overlay background
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.style.display = "none";
  }
});

// ─── Donor Survey Result ─────────────────────────────────────────
function showSurveyResult() {
  const questions = document.querySelectorAll("#donor-survey .survey-question");
  let riskFlags = 0;
  // Q3 (donated recently), Q4 (infectious disease), Q5 (medication) indicate possible inaptitude
  const riskQuestions = [2, 3, 4, 5, 6]; // 0-indexed
  questions.forEach((q, i) => {
    const yesChecked = q.querySelector('input[type="radio"]:checked');
    const isYes = yesChecked && yesChecked.closest(".survey-option.yes");
    if (riskQuestions.includes(i) && isYes) riskFlags++;
    // Q0 (age) and Q1 (weight): if No, it's a risk
    if (
      (i === 0 || i === 1) &&
      yesChecked &&
      yesChecked.closest(".survey-option.no")
    )
      riskFlags++;
  });

  const title = document.getElementById("surveyResultTitle");
  const msg = document.getElementById("surveyResultMsg");
  const icon = document.getElementById("surveyResultIcon");

  if (riskFlags > 0) {
    title.textContent = "Gracias por responder";
    msg.textContent =
      "Algunos de tus datos sugieren que por ahora no podrías donar, pero puedes participar de otras formas en la comunidad.";
    icon.style.background = "linear-gradient(135deg, #FF9800, #F57C00)";
  } else {
    title.textContent = "¡Pareces ser un buen donante!";
    msg.textContent =
      "Cuando veas una solicitud compatible, anímate a ayudar. ¡Juntos salvamos vidas!";
    icon.style.background = "linear-gradient(135deg, #E63946, #C1121F)";
  }

  showScreen("donor-survey-result");
}

// ─── Star Rating ─────────────────────────────────────────────────
function initStarRating() {
  const starsInput = document.getElementById("starsInput");
  const starsDesc = document.getElementById("starsDesc");
  const labels = ["Muy mala", "Mala", "Regular", "Buena", "¡Excelente!"];

  if (!starsInput) return;

  const stars = starsInput.querySelectorAll(".star-item");
  let selected = 0;

  stars.forEach((star, i) => {
    star.addEventListener("mouseenter", () => highlightStars(stars, i + 1));
    star.addEventListener("mouseleave", () => highlightStars(stars, selected));
    star.addEventListener("click", () => {
      selected = i + 1;
      highlightStars(stars, selected);
      if (starsDesc) starsDesc.textContent = labels[i];
    });
  });
}

function highlightStars(stars, count) {
  stars.forEach((s, i) => {
    s.style.color = i < count ? "#E63946" : "#ccc";
  });
}

// ─── Blood Drop Celebration ───────────────────────────────────────
function triggerBloodDrop(containerId) {
  const el =
    document.getElementById(containerId) ||
    document.querySelector(".blood-drop-celebration");
  if (el) {
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 3000);
  }
}
