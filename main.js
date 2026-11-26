const cover = document.querySelector("#cover");
const openButton = document.querySelector("#open-invitation");
const guestName = document.querySelector("#guest-name");
const musicButton = document.querySelector("#music-toggle");
const musicLabel = document.querySelector(".music-label");
const toast = document.querySelector("#toast");
const eventStart = new Date("2026-12-20T09:00:00+07:00");
const eventEnd = new Date("2026-12-20T14:00:00+07:00");
const storageKey = "alya-raka-wishes";
let audioContext;
let musicTimer;
let chordIndex = 0;
let toastTimer;

const guest = new URLSearchParams(window.location.search).get("to");
if (guest && guest.trim()) {
  guestName.textContent = guest.trim().slice(0, 100);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function playChord() {
  if (!audioContext || audioContext.state !== "running") return;
  const chords = [
    [261.63, 329.63, 392, 493.88],
    [220, 261.63, 329.63, 392],
    [174.61, 220, 261.63, 349.23],
    [196, 246.94, 293.66, 392]
  ];
  const now = audioContext.currentTime;
  const frequencies = chords[chordIndex % chords.length];
  chordIndex += 1;

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0, now);
    volume.gain.linearRampToValueAtTime(index === 0 ? 0.035 : 0.018, now + 0.35);
    volume.gain.setTargetAtTime(0, now + 2.2, 0.45);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 4);
  });
}

async function startMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    showToast("Browser ini belum mendukung pemutar musik.");
    return false;
  }

  try {
    if (!audioContext) audioContext = new AudioContextClass();
    await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("Audio belum dapat diputar.");
    playChord();
    musicTimer = window.setInterval(playChord, 3000);
    musicButton.classList.add("is-playing");
    musicButton.setAttribute("aria-pressed", "true");
    musicButton.setAttribute("aria-label", "Jeda musik");
    musicLabel.textContent = "MUSIC ON";
    return true;
  } catch (error) {
    showToast("Musik belum dapat diputar. Coba tekan tombol musik.");
    return false;
  }
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = undefined;
  if (audioContext && audioContext.state === "running") audioContext.suspend();
  musicButton.classList.remove("is-playing");
  musicButton.setAttribute("aria-pressed", "false");
  musicButton.setAttribute("aria-label", "Putar musik");
  musicLabel.textContent = "MUSIC OFF";
}

openButton.addEventListener("click", async () => {
  cover.classList.add("is-open");
  document.body.classList.remove("cover-open");
  window.setTimeout(() => cover.setAttribute("aria-hidden", "true"), 1200);
  await startMusic();
});

musicButton.addEventListener("click", async () => {
  if (musicButton.classList.contains("is-playing")) {
    stopMusic();
  } else {
    await startMusic();
  }
});

function updateCountdown() {
  const remaining = Math.max(0, eventStart.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  document.querySelector("#days").textContent = String(Math.floor(totalSeconds / 86400)).padStart(3, "0");
  document.querySelector("#hours").textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  document.querySelector("#minutes").textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  document.querySelector("#seconds").textContent = String(totalSeconds % 60).padStart(2, "0");
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const calendarTitle = "Pernikahan Alya & Raka";
const calendarDescription = "Akad dan resepsi pernikahan Alya Velin Leskari dan Raka Christ Wiratama.";
const googleDates = "20261220T020000Z/20261220T070000Z";
const googleCalendarUrl = new URL("https://calendar.google.com/calendar/render");
googleCalendarUrl.search = new URLSearchParams({
  action: "TEMPLATE",
  text: calendarTitle,
  dates: googleDates,
  details: calendarDescription,
  location: "The Langham Jakarta, District 8, SCBD Lot 28, Jakarta Selatan"
}).toString();
document.querySelector("#calendar-link").href = googleCalendarUrl.toString();

document.querySelector("#download-calendar").addEventListener("click", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alya dan Raka//Undangan Pernikahan//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "DTSTART:20261220T020000Z",
    "DTEND:20261220T070000Z",
    `SUMMARY:${calendarTitle}`,
    `DESCRIPTION:${calendarDescription}`,
    "LOCATION:The Langham Jakarta\\, District 8\\, SCBD Lot 28\\, Jakarta Selatan",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const file = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = "undangan-alya-raka.ics";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
  showToast("File kalender berhasil diunduh.");
});

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard tidak tersedia.");
    }
    showToast("Berhasil disalin!");
  } catch (error) {
    showToast("Tidak dapat menyalin. Silakan salin secara manual.");
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.copy));
});

function readWishes() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const wishes = JSON.parse(stored);
    if (!Array.isArray(wishes)) throw new Error("Format buku tamu tidak valid.");
    return wishes;
  } catch (error) {
    showToast("Ucapan tersimpan tidak dapat dibaca di browser ini.");
    return [];
  }
}

function renderWishes() {
  const list = document.querySelector("#wish-list");
  list.replaceChildren();
  readWishes().slice().reverse().forEach((wish) => {
    const item = document.createElement("article");
    const name = document.createElement("strong");
    const attendance = document.createElement("span");
    const message = document.createElement("p");
    item.className = "wish-item";
    name.textContent = wish.name;
    attendance.className = "wish-attendance";
    attendance.textContent = wish.attendance || "";
    message.textContent = wish.message;
    item.append(name, attendance, message);
    list.append(item);
  });
}

document.querySelector("#wish-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const wish = {
    name: String(formData.get("name")).trim(),
    attendance: String(formData.get("attendance") || ""),
    message: String(formData.get("message")).trim(),
    createdAt: new Date().toISOString()
  };
  if (!wish.name || !wish.attendance || !wish.message) {
    showToast("Isi nama, konfirmasi kehadiran, dan ucapan terlebih dahulu.");
    return;
  }

  try {
    const wishes = readWishes();
    wishes.push(wish);
    localStorage.setItem(storageKey, JSON.stringify(wishes));
    form.reset();
    renderWishes();
    showToast("Ucapanmu berhasil dikirim. Terima kasih!");
  } catch (error) {
    showToast("Ucapan belum dapat disimpan. Periksa ruang penyimpanan browser.");
  }
});

renderWishes();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}
