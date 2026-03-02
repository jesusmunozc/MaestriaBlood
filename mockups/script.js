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
});
