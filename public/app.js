// Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor('#0b131f');
}

// Global holat
const currentUserId = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : null;
const currentUsername = tg?.initDataUnsafe?.user?.username || '';
const currentFirstName = tg?.initDataUnsafe?.user?.first_name || 'Foydalanuvchi';

let currentStep = 1;
let selectedLanguage = 'uz';
let selectedCategory = 'education';
let selectedCount = 8;
let selectedTheme = 'ocean';
let attachedDocumentData = null; // { name, base64, text }
let currentGeneratedData = null;
let userData = null;

// DOM elementlar
const userAvatarEl = document.getElementById('userAvatar');
const userNameEl = document.getElementById('userName');
const headerCoinsTextEl = document.getElementById('headerCoinsText');
const headerLimitProgressEl = document.getElementById('headerLimitProgress');
const openLimitTabBtn = document.getElementById('openLimitTabBtn');

const seg1 = document.getElementById('seg1');
const seg2 = document.getElementById('seg2');
const seg3 = document.getElementById('seg3');
const seg4 = document.getElementById('seg4');
const stepCounterText = document.getElementById('stepCounterText');
const stepNameText = document.getElementById('stepNameText');

const wizardStep1 = document.getElementById('wizardStep1');
const wizardStep2 = document.getElementById('wizardStep2');
const wizardStep3 = document.getElementById('wizardStep3');
const wizardStep4 = document.getElementById('wizardStep4');

const topicInput = document.getElementById('topicInput');
const orgInput = document.getElementById('orgInput');
const docFileInput = document.getElementById('docFileInput');
const attachDocBtn = document.getElementById('attachDocBtn');
const attachedFileNameText = document.getElementById('attachedFileNameText');

const btnPrevStep = document.getElementById('btnPrevStep');
const btnNextStep = document.getElementById('btnNextStep');
const btnGenerate = document.getElementById('btnGenerate');
const slideWizardForm = document.getElementById('slideWizardForm');

const loadingBox = document.getElementById('loadingBox');
const loadingStatusText = document.getElementById('loadingStatusText');
const resultBox = document.getElementById('resultBox');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const downloadBtn = document.getElementById('downloadBtn');
const sendChatBtn = document.getElementById('sendChatBtn');
const createAgainBtn = document.getElementById('createAgainBtn');

// 1. Profil ma'lumotlarini o'rnatish
if (userAvatarEl && currentFirstName) {
  userAvatarEl.textContent = currentFirstName.charAt(0).toUpperCase();
}
if (userNameEl) {
  userNameEl.textContent = currentFirstName;
}

// 2. Foydalanuvchi ma'lumotlarini serverdan yuklash
async function fetchUserData() {
  if (!currentUserId) return;
  try {
    const res = await fetch(`/api/user/${currentUserId}`);
    const data = await res.json();
    if (data.success && data.user) {
      userData = data.user;
      
      // Header ma'lumotlari
      if (headerCoinsTextEl) {
        headerCoinsTextEl.textContent = `${userData.coins} ta bepul taqdimot`;
      }
      if (headerLimitProgressEl) {
        headerLimitProgressEl.textContent = `${userData.referralProgress || 0} / 3 ta`;
      }
      const limitCoinsBig = document.getElementById('limitCoinsBig');
      if (limitCoinsBig) {
        limitCoinsBig.textContent = `${userData.coins} ta`;
      }

      // Referal progress
      const fill = ((userData.referralProgress || 0) / 3) * 100;
      const refProgressFill = document.getElementById('refProgressFill');
      if (refProgressFill) refProgressFill.style.width = `${fill}%`;
      const refProgressLabelText = document.getElementById('refProgressLabelText');
      if (refProgressLabelText) {
        refProgressLabelText.textContent = `${userData.referralProgress || 0} / 3 ta do'st`;
      }

      // Tarix soni
      const historyBadge = document.getElementById('historyCountBadge');
      if (data.presentationsCount > 0 && historyBadge) {
        historyBadge.textContent = data.presentationsCount;
        historyBadge.classList.remove('hidden');
      }

      // Agar Admin bo'lsa, Admin tabini ochish
      if (data.isAdmin) {
        const adminTab = document.getElementById('adminNavTab');
        if (adminTab) adminTab.classList.remove('hidden');
      }

      // Kanal bonusi holati
      if (data.channelBonusClaimed) {
        const btnVerify = document.getElementById('btnVerifyChannel');
        if (btnVerify) {
          btnVerify.disabled = true;
          btnVerify.textContent = '✅ Bonus olingan (+2 koin)';
          btnVerify.classList.add('claimed');
        }
      }
      if (data.channelUsername) {
        const channelLink = document.getElementById('btnJoinChannelLink');
        if (channelLink) {
          channelLink.href = `https://t.me/${data.channelUsername.replace('@', '')}`;
        }
      }
    }
  } catch (err) {
    console.warn('User data fetch error:', err);
  }
}

fetchUserData();

// 3. Tablar (Xonalar) o'rtasida navigatsiya
document.querySelectorAll('.nav-tab').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    switchTab(tabBtn.dataset.tab);
  });
});

if (openLimitTabBtn) {
  openLimitTabBtn.addEventListener('click', () => {
    switchTab('tabLimit');
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const activeBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const content = document.getElementById(tabId);
  if (content) content.classList.add('active');

  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();

  // Agar Slaydlarim bo'lsa, ro'yxatni yangilash
  if (tabId === 'tabHistory') loadUserHistory();
  // Agar Admin bo'lsa, admin ma'lumotlarini yuklash
  if (tabId === 'tabAdmin') loadAdminDashboard();
}

// 4. Tezkor mavzular (Pills)
document.querySelectorAll('.tag-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    topicInput.value = btn.dataset.topic;
    topicInput.focus();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  });
});

// 5. Hujjat biriktirish (PDF / DOCX)
if (attachDocBtn && docFileInput) {
  attachDocBtn.addEventListener('click', () => docFileInput.click());

  docFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      attachedFileNameText.textContent = `✅ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      if (!topicInput.value.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
        topicInput.value = cleanName;
      }
      // Faylni o'qish
      const reader = new FileReader();
      reader.onload = (event) => {
        attachedDocumentData = {
          name: file.name,
          base64: event.target.result.split(',')[1] || '',
        };
      };
      reader.readAsDataURL(file);
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
  });
}

// 5.1. Taqdimot tili tanlash (4 ta til)
document.querySelectorAll('#languageSelectionGrid .lang-pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#languageSelectionGrid .lang-pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLanguage = btn.dataset.lang || 'uz';
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
});

// 6. Kategoriyalar tanlash (Soha)
document.querySelectorAll('#categorySelectionGrid .category-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#categorySelectionGrid .category-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedCategory = card.dataset.cat;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
});

// 7. Slaydlar soni tanlash
document.querySelectorAll('#countSelectionGrid .count-pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#countSelectionGrid .count-pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCount = parseInt(btn.dataset.count, 10);
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
});

// 8. Dizayn temalari tanlash
document.querySelectorAll('#themeSelectionGrid .theme-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#themeSelectionGrid .theme-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    selectedTheme = opt.dataset.theme;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
});

// 9. Wizard Qadamlari Navigatsiyasi (1 -> 2 -> 3 -> 4)
const stepNames = ['', 'Mavzu', 'Yo\'nalish & Tashkilot', 'Slaydlar soni', 'Fon va Dizayn'];

function updateWizardStep(step) {
  currentStep = step;

  // Segmented bar
  [seg1, seg2, seg3, seg4].forEach((seg, i) => {
    if (i + 1 <= currentStep) seg.classList.add('active');
    else seg.classList.remove('active');
  });

  stepCounterText.textContent = `Qadam ${currentStep} / 4`;
  stepNameText.textContent = stepNames[currentStep];

  // Qadamlar oynalari
  [wizardStep1, wizardStep2, wizardStep3, wizardStep4].forEach((ws, i) => {
    if (i + 1 === currentStep) ws.classList.add('active');
    else ws.classList.remove('active');
  });

  // Tugmalar holati
  if (currentStep === 1) {
    btnPrevStep.classList.add('hidden');
    btnNextStep.classList.remove('hidden');
    btnGenerate.classList.add('hidden');
  } else if (currentStep === 4) {
    btnPrevStep.classList.remove('hidden');
    btnNextStep.classList.add('hidden');
    btnGenerate.classList.remove('hidden');
  } else {
    btnPrevStep.classList.remove('hidden');
    btnNextStep.classList.remove('hidden');
    btnGenerate.classList.add('hidden');
  }

  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

btnNextStep.addEventListener('click', () => {
  if (currentStep === 1 && !topicInput.value.trim()) {
    topicInput.focus();
    if (tg?.showAlert) tg.showAlert('Iltimos, taqdimot mavzusini yozing!');
    else alert('Iltimos, taqdimot mavzusini yozing!');
    return;
  }
  if (currentStep < 4) updateWizardStep(currentStep + 1);
});

btnPrevStep.addEventListener('click', () => {
  if (currentStep > 1) updateWizardStep(currentStep - 1);
});

// 10. Form Yuborish & Taqdimot Generatsiyasi
slideWizardForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const topic = topicInput.value.trim();
  const organization = orgInput?.value?.trim() || '';

  if (!topic) {
    updateWizardStep(1);
    topicInput.focus();
    return;
  }

  // Loading holati
  slideWizardForm.classList.add('hidden');
  loadingBox.classList.remove('hidden');
  loadingStatusText.textContent = 'Mavzu bo\'yicha tahliliy reja tuzilmoqda...';

  const statusTimer = setInterval(() => {
    const statuses = [
      'Mavzu bo\'yicha professional reja tuzilmoqda...',
      'Mavzuga mos 4K sifatli rasmlar yuklanmoqda...',
      'Slayd dizayni va animatsiyali perexodlar yig\'ilmoqda...',
      'PowerPoint (.pptx) fayli shakllantirilmoqda...'
    ];
    const rand = statuses[Math.floor(Math.random() * statuses.length)];
    loadingStatusText.textContent = rand;
  }, 3500);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        category: selectedCategory,
        organization,
        slideCount: selectedCount,
        language: selectedLanguage,
        theme: selectedTheme,
        chatId: currentUserId,
        username: currentUsername,
        firstName: currentFirstName,
      }),
    });

    clearInterval(statusTimer);
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (data.error === 'NO_COINS') {
        const payMsg = "🪙 Sizda imkoniyatlar (coin) tugadi!\n\n1 ta taqdimot: 5 000 so'm\nKarta: 9860160142530080\n\nYoki 3 ta do'stingizni taklif qilib, bepul coin oling! (Limit bo'limi)";
        if (tg?.showAlert) tg.showAlert(payMsg);
        else alert(payMsg);
        loadingBox.classList.add('hidden');
        slideWizardForm.classList.remove('hidden');
        switchTab('tabLimit');
        return;
      }
      throw new Error(data.error || 'Generatsiyada xatolik yuz berdi');
    }

    currentGeneratedData = data;

    // Natija ekrani
    loadingBox.classList.add('hidden');
    resultBox.classList.remove('hidden');

    resultTitle.textContent = data.title;
    resultSubtitle.textContent = `${data.slidesCount} ta slayd • ${selectedTheme.toUpperCase()} uslubida tayyorlandi`;

    downloadBtn.href = data.downloadUrl;
    downloadBtn.setAttribute('download', data.fileName);

    if (currentUserId) {
      sendChatBtn.style.display = 'block';
    } else {
      sendChatBtn.style.display = 'none';
    }

    // Slaydlarni jonli ko'rish karuseli va himoya nutqini yuklash
    if (data.slides && data.slides.length) {
      initSlidePreview(data.slides);
    }
    if (data.speakerNotes || (data.slides && data.slides.length)) {
      initSpeechNotes(data.speakerNotes || data.slides, data.title);
    }

    // Balansni yangilash
    fetchUserData();

    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  } catch (err) {
    clearInterval(statusTimer);
    console.error(err);
    const msg = "Kechirasiz, qisqa uzilish bo'ldi. Iltimos, yana bir bor 'Taqdimot Yaratish' tugmasini bosing.";
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);
    loadingBox.classList.add('hidden');
    slideWizardForm.classList.remove('hidden');
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
  }
});

// Chatga yuborish tugmasi
if (sendChatBtn) {
  sendChatBtn.addEventListener('click', async () => {
    if (!currentGeneratedData || !currentUserId) return;
    try {
      sendChatBtn.textContent = '⏳ Yuborilmoqda...';
      sendChatBtn.disabled = true;

      const res = await fetch('/api/send-to-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentUserId,
          fileName: currentGeneratedData.fileName,
          title: currentGeneratedData.title,
        }),
      });

      const d = await res.json();
      if (d.success) {
        sendChatBtn.textContent = '✅ Chatga yuborildi!';
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      } else {
        sendChatBtn.textContent = '📤 Qayta urinish';
        sendChatBtn.disabled = false;
      }
    } catch (_) {
      sendChatBtn.textContent = '📤 Telegram chatga yuborish';
      sendChatBtn.disabled = false;
    }
  });
}

// Yangi taqdimot yaratish
if (createAgainBtn) {
  createAgainBtn.addEventListener('click', () => {
    resultBox.classList.add('hidden');
    slideWizardForm.classList.remove('hidden');
    updateWizardStep(1);
    topicInput.value = '';
    attachedDocumentData = null;
    attachedFileNameText.textContent = "📎 Word yoki PDF ma'ruza biriktirish (Ixtiyoriy)";
  });
}

// 11. Slaydlarim (Tarix yuklash)
async function loadUserHistory() {
  const container = document.getElementById('historyListContainer');
  if (!container || !currentUserId) return;

  container.innerHTML = '<p style="color:#94a3b8; font-size:13px; text-align:center;">Yuklanmoqda...</p>';

  try {
    const res = await fetch(`/api/presentations/${currentUserId}`);
    const data = await res.json();

    if (!data.success || !data.presentations || !data.presentations.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span>📭</span>
          <p>Hozircha yaratilgan taqdimotlar yo'q.<br>"Yaratish" bo'limidan birinchi slaydingizni yarating!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    data.presentations.forEach(p => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const timeStr = new Date(p.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <h4 class="history-title">${p.topic}</h4>
        <div class="history-meta">
          <span>🎯 ${p.category}</span> • <span>📄 ${p.slideCount} ta slayd</span> • <span>⏰ ${timeStr}</span>
        </div>
        <div class="history-actions">
          <a href="${p.downloadUrl}" class="history-btn" download="${p.fileName}">⬇️ Yuklab olish</a>
          <button type="button" class="history-btn send-history-btn" data-fn="${p.fileName}" data-title="${p.topic}">📤 Chatga</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Chatga yuborish tugmalari
    container.querySelectorAll('.send-history-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.textContent = '⏳ ...';
        await fetch('/api/send-to-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentUserId,
            fileName: btn.dataset.fn,
            title: btn.dataset.title,
          })
        });
        btn.textContent = '✅ Yuborildi';
      });
    });
  } catch (err) {
    container.innerHTML = '<p style="color:#ef4444; font-size:13px;">Tarixni yuklashda xatolik yuz berdi.</p>';
  }
}

// 12. Referal havolasidan nusxa olish va ulashish
const copyRefLinkBtn = document.getElementById('copyRefLinkBtn');
const shareRefLinkBtn = document.getElementById('shareRefLinkBtn');

if (copyRefLinkBtn) {
  copyRefLinkBtn.addEventListener('click', () => {
    const link = `https://t.me/AhroriAIbot?start=ref_${currentUserId || '123'}`;
    navigator.clipboard.writeText(link).then(() => {
      copyRefLinkBtn.textContent = '✅ Nusxa olindi!';
      setTimeout(() => copyRefLinkBtn.textContent = '📋 Havoladan nusxa olish', 2000);
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    });
  });
}

if (shareRefLinkBtn) {
  shareRefLinkBtn.addEventListener('click', () => {
    const link = `https://t.me/AhroriAIbot?start=ref_${currentUserId || '123'}`;
    const text = "Do'stim, mana bu AI bot PowerPoint taqdimotlarni bir necha daqiqada tayyorlab berar ekan! 5 ta bepul slayd beradi:";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
  });
}

// 13. Koin sotib olish, To'lov ilovalari va Tasdiqlash modali
let selectedPackage = { coins: 5, amount: 20000, stars: 60 };
let pendingPaymentUrl = '';

// Paket kartochkalarini tanlash
document.querySelectorAll('.pkg-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.pkg-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const coins = parseInt(card.dataset.coins, 10);
    const amount = parseInt(card.dataset.amount, 10);
    const stars = parseInt(card.dataset.stars || (coins === 1 ? 15 : coins === 3 ? 40 : coins === 5 ? 60 : 100), 10);
    selectedPackage = { coins, amount, stars };

    const formattedAmount = `${amount.toLocaleString()} so'm (${coins} ta koin)`;
    const elPayme = document.getElementById('paymeAmountText');
    const elClick = document.getElementById('clickAmountText');
    const elUzum = document.getElementById('uzumAmountText');
    const elPaynet = document.getElementById('paynetAmountText');
    const elStars = document.getElementById('starsAmountText');

    if (elPayme) elPayme.textContent = formattedAmount;
    if (elClick) elClick.textContent = formattedAmount;
    if (elUzum) elUzum.textContent = formattedAmount;
    if (elPaynet) elPaynet.textContent = formattedAmount;
    if (elStars) elStars.textContent = `${stars} ⭐️ Stars (${coins} ta koin)`;

    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
});

// Telegram Stars to'lov tugmasi
const btnPayStars = document.getElementById('btnPayStars');
if (btnPayStars) {
  btnPayStars.addEventListener('click', async () => {
    if (!currentUserId) {
      if (tg?.showAlert) tg.showAlert('Iltimos, Telegram ilovasi orqali kiring!');
      else alert('Iltimos, Telegram ilovasi orqali kiring!');
      return;
    }

    const descEl = btnPayStars.querySelector('.app-desc');
    btnPayStars.disabled = true;
    if (descEl) descEl.textContent = '⏳ To\'lov linki tayyorlanmoqda...';

    try {
      const res = await fetch('/api/create-stars-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          packageCoins: selectedPackage.coins,
          packageStars: selectedPackage.stars || 60,
        }),
      });

      const data = await res.json();
      if (data.success && data.invoiceLink) {
        if (tg?.openInvoice) {
          tg.openInvoice(data.invoiceLink, (status) => {
            if (status === 'paid') {
              if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
              if (tg?.showAlert) {
                tg.showAlert(`🎉 Tabriklaymiz! +${selectedPackage.coins} ta koin muvaffaqiyatli hisobingizga qo'shildi!`);
              } else {
                alert(`🎉 Tabriklaymiz! +${selectedPackage.coins} ta koin muvaffaqiyatli hisobingizga qo'shildi!`);
              }
              fetchUserData();
            } else if (status === 'cancelled') {
              // Foydalanuvchi bekor qildi
            } else if (status === 'failed') {
              if (tg?.showAlert) tg.showAlert('To\'lov amalga oshmadi yoki bekor qilindi.');
            }
          });
        } else if (tg?.openTelegramLink) {
          tg.openTelegramLink(data.invoiceLink);
        } else {
          window.open(data.invoiceLink, '_blank');
        }
      } else {
        throw new Error(data.error || 'Link yaratilmadi');
      }
    } catch (err) {
      console.error('Stars payment error:', err);
      if (tg?.showAlert) tg.showAlert('Xatolik: ' + err.message);
      else alert('Xatolik: ' + err.message);
    } finally {
      btnPayStars.disabled = false;
      const elStars = document.getElementById('starsAmountText');
      if (elStars) {
        elStars.textContent = `${selectedPackage.stars || 60} ⭐️ Stars (${selectedPackage.coins} ta koin)`;
      }
    }
  });
}

// Modalni boshqarish
const CARD_NUMBER_RAW = '9860160142530080';
const paymentModalOverlay = document.getElementById('paymentModalOverlay');
const modalAppIcon = document.getElementById('modalAppIcon');
const modalAppTitle = document.getElementById('modalAppTitle');
const modalAppAmount = document.getElementById('modalAppAmount');
const modalAppCoins = document.getElementById('modalAppCoins');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCopyBanner = document.getElementById('modalCopyBanner');
const modalCopyCardAgainBtn = document.getElementById('modalCopyCardAgainBtn');

function openPaymentModal(appName, icon, url) {
  pendingPaymentUrl = url;
  if (modalAppIcon) modalAppIcon.textContent = icon;
  if (modalAppTitle) modalAppTitle.textContent = `${appName} orqali to'lash`;
  if (modalAppAmount) modalAppAmount.textContent = `${selectedPackage.amount.toLocaleString()} so'm`;
  if (modalAppCoins) modalAppCoins.textContent = `${selectedPackage.coins} ta koin`;

  // Karta raqamidan darhol xotiraga nusxa olish
  try {
    navigator.clipboard.writeText(CARD_NUMBER_RAW);
    if (modalCopyBanner) {
      modalCopyBanner.textContent = `✅ Karta raqami (${CARD_NUMBER_RAW}) xotiraga nusxalandi!`;
      modalCopyBanner.classList.remove('hidden');
    }
  } catch (_) {}

  if (paymentModalOverlay) paymentModalOverlay.classList.remove('hidden');
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

if (modalCopyCardAgainBtn) {
  modalCopyCardAgainBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(CARD_NUMBER_RAW).then(() => {
      modalCopyCardAgainBtn.textContent = '✅ Nusxa olindi!';
      setTimeout(() => {
        modalCopyCardAgainBtn.textContent = '📋 Karta raqamini qayta nusxalash';
      }, 2000);
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    });
  });
}

if (modalCancelBtn) {
  modalCancelBtn.addEventListener('click', () => {
    if (paymentModalOverlay) paymentModalOverlay.classList.add('hidden');
  });
}

if (modalConfirmBtn) {
  modalConfirmBtn.addEventListener('click', () => {
    try {
      navigator.clipboard.writeText(CARD_NUMBER_RAW);
    } catch (_) {}

    if (paymentModalOverlay) paymentModalOverlay.classList.add('hidden');

    if (pendingPaymentUrl) {
      if (tg?.openLink) {
        tg.openLink(pendingPaymentUrl);
      } else {
        window.open(pendingPaymentUrl, '_blank');
      }
    }
  });
}

// Payme tugmasi
const btnPayPayme = document.getElementById('btnPayPayme');
if (btnPayPayme) {
  btnPayPayme.addEventListener('click', () => {
    const url = `https://payme.uz/p2p/${CARD_NUMBER_RAW}`;
    openPaymentModal('Payme', '🟢', url);
  });
}

// Click Up tugmasi
const btnPayClick = document.getElementById('btnPayClick');
if (btnPayClick) {
  btnPayClick.addEventListener('click', () => {
    const url = `https://my.click.uz/clickp2p/${CARD_NUMBER_RAW}`;
    openPaymentModal('Click Up', '🔵', url);
  });
}

// Uzum Bank tugmasi
const btnPayUzum = document.getElementById('btnPayUzum');
if (btnPayUzum) {
  btnPayUzum.addEventListener('click', () => {
    const url = `https://app.uzumbank.uz/`;
    openPaymentModal('Uzum Bank', '🟣', url);
  });
}

// Paynet tugmasi
const btnPayPaynet = document.getElementById('btnPayPaynet');
if (btnPayPaynet) {
  btnPayPaynet.addEventListener('click', () => {
    const url = `https://paynet.uz/`;
    openPaymentModal('Paynet', '🟠', url);
  });
}

// Karta raqamidan nusxa olish
const copyCardBtn = document.getElementById('copyCardBtn');
if (copyCardBtn) {
  copyCardBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('9860160142530080').then(() => {
      copyCardBtn.textContent = '✅ Nusxa olindi!';
      setTimeout(() => copyCardBtn.textContent = '📋 Nusxa olish', 2000);
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    });
  });
}

// In-App Chek rasmini yuklash
const inappReceiptInput = document.getElementById('inappReceiptInput');
const btnTriggerReceiptUpload = document.getElementById('btnTriggerReceiptUpload');
const receiptPreviewBox = document.getElementById('receiptPreviewBox');
const receiptPreviewImg = document.getElementById('receiptPreviewImg');
const btnSubmitReceipt = document.getElementById('btnSubmitReceipt');
const receiptStatusMsg = document.getElementById('receiptStatusMsg');

let currentReceiptBase64 = null;

if (btnTriggerReceiptUpload && inappReceiptInput) {
  btnTriggerReceiptUpload.addEventListener('click', () => {
    inappReceiptInput.click();
  });

  inappReceiptInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      currentReceiptBase64 = reader.result;
      if (receiptPreviewImg) receiptPreviewImg.src = currentReceiptBase64;
      if (receiptPreviewBox) receiptPreviewBox.classList.remove('hidden');
      if (receiptStatusMsg) receiptStatusMsg.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });
}

if (btnSubmitReceipt) {
  btnSubmitReceipt.addEventListener('click', async () => {
    if (!currentReceiptBase64 || !currentUserId) return;

    btnSubmitReceipt.disabled = true;
    btnSubmitReceipt.textContent = '⏳ Yuklanmoqda...';

    try {
      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          username: currentUsername,
          firstName: currentFirstName,
          imageBase64: currentReceiptBase64,
          packageAmount: selectedPackage.amount,
          packageCoins: selectedPackage.coins,
        })
      });

      const data = await res.json();
      if (receiptStatusMsg) {
        receiptStatusMsg.classList.remove('hidden');
        if (data.success) {
          receiptStatusMsg.className = 'receipt-status-msg success';
          receiptStatusMsg.textContent = '✅ ' + data.message;
          if (receiptPreviewBox) receiptPreviewBox.classList.add('hidden');
          currentReceiptBase64 = null;
        } else {
          receiptStatusMsg.className = 'receipt-status-msg error';
          receiptStatusMsg.textContent = '❌ ' + (data.error || 'Xatolik yuz berdi');
        }
      }
    } catch (err) {
      if (receiptStatusMsg) {
        receiptStatusMsg.classList.remove('hidden');
        receiptStatusMsg.className = 'receipt-status-msg error';
        receiptStatusMsg.textContent = '❌ Server bilan bog\'lanishda xatolik';
      }
    } finally {
      btnSubmitReceipt.disabled = false;
      btnSubmitReceipt.textContent = '🚀 Adminga tekshiruvga yuborish';
    }
  });
}

// 14. Admin Dashboard
async function loadAdminDashboard() {
  if (!currentUserId) return;
  try {
    const res = await fetch(`/api/admin/dashboard?adminId=${currentUserId}`);
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('adminTotalUsers').textContent = data.stats.totalUsers;
    document.getElementById('adminTotalPres').textContent = data.stats.totalPresentations;
    document.getElementById('adminTotalCoins').textContent = data.stats.totalCoinsUsed;

    const listContainer = document.getElementById('adminPresLogsList');
    if (!data.presentations || !data.presentations.length) {
      listContainer.innerHTML = '<p style="color:#64748b; font-size:13px;">Hozircha taqdimotlar mavjud emas.</p>';
      return;
    }

    listContainer.innerHTML = '';
    data.presentations.forEach(p => {
      const item = document.createElement('div');
      item.className = 'log-item';
      const timeStr = new Date(p.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `
        <div class="log-user">${p.firstName} ${p.username ? `(@${p.username})` : `[ID:${p.userId}]`}</div>
        <div class="log-topic">📌 <b>${p.topic}</b></div>
        <div class="log-meta">🎯 ${p.category} • 📄 ${p.slideCount} slayd • ⏰ ${timeStr}</div>
      `;
      listContainer.appendChild(item);
    });

    // Kelib tushgan taklif va talablar ro'yxati
    const fbContainer = document.getElementById('adminFeedbackLogsList');
    if (fbContainer) {
      if (!data.feedbacks || !data.feedbacks.length) {
        fbContainer.innerHTML = '<p style="color:#64748b; font-size:13px;">Hozircha taklif yoki talablar mavjud emas.</p>';
      } else {
        fbContainer.innerHTML = '';
        data.feedbacks.forEach(fb => {
          const item = document.createElement('div');
          item.className = 'log-item feedback-log-item';
          const timeStr = new Date(fb.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          item.innerHTML = `
            <div class="log-user" style="display:flex; justify-content:space-between; align-items:center;">
              <span>👤 <b>${fb.firstName}</b> ${fb.username ? `(@${fb.username})` : `[ID:${fb.userId}]`}</span>
              <span style="font-size:11px; color:#94a3b8;">${timeStr}</span>
            </div>
            <div class="log-topic" style="color:#f8fafc; font-size:13px; font-weight:500; margin-top:6px; white-space:pre-wrap; background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">💬 "${fb.message}"</div>
          `;
          fbContainer.appendChild(item);
        });
      }
    }
  } catch (err) {
    console.error('Admin load error:', err);
  }
}

// Admin foydalanuvchiga coin berish
const submitGiveCoinsBtn = document.getElementById('submitGiveCoinsBtn');
if (submitGiveCoinsBtn) {
  submitGiveCoinsBtn.addEventListener('click', async () => {
    const targetUserId = document.getElementById('targetUserIdInput').value.trim();
    const amount = document.getElementById('giveAmountInput').value.trim();

    if (!targetUserId || !amount) {
      if (tg?.showAlert) tg.showAlert('Foydalanuvchi ID va coin miqdorini kiriting!');
      else alert('Foydalanuvchi ID va coin miqdorini kiriting!');
      return;
    }

    submitGiveCoinsBtn.textContent = '⏳ ...';
    try {
      const res = await fetch('/api/admin/give-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUserId,
          targetUserId,
          amount,
        }),
      });

      const d = await res.json();
      if (d.success) {
        if (tg?.showAlert) tg.showAlert(`✅ Foydalanuvchiga +${amount} ta coin berildi!`);
        else alert(`✅ Foydalanuvchiga +${amount} ta coin berildi!`);
        document.getElementById('targetUserIdInput').value = '';
        loadAdminDashboard();
      } else {
        if (tg?.showAlert) tg.showAlert('Xatolik: ' + d.error);
        else alert('Xatolik: ' + d.error);
      }
    } catch (_) {}
    submitGiveCoinsBtn.textContent = 'Coin Berish';
  });
}

// 15. ADMINGA TAKLIF VA TALABLAR (FEEDBACK)
const btnCopyAdminUsername = document.getElementById('btnCopyAdminUsername');
const copyBtnLabel = document.getElementById('copyBtnLabel');
const btnOpenAdminTelegram = document.getElementById('btnOpenAdminTelegram');
const btnSubmitFeedback = document.getElementById('btnSubmitFeedback');
const feedbackTextInput = document.getElementById('feedbackTextInput');
const feedbackAlertBox = document.getElementById('feedbackAlertBox');

const ADMIN_USERNAME = 'akhrorov18';

// Username nusxa olish (@akhrorov18)
if (btnCopyAdminUsername) {
  btnCopyAdminUsername.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(`@${ADMIN_USERNAME}`);
      if (copyBtnLabel) copyBtnLabel.textContent = '✅ Nusxalandi!';
      btnCopyAdminUsername.classList.add('copied');
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      setTimeout(() => {
        if (copyBtnLabel) copyBtnLabel.textContent = '@akhrorov18 nusxalash';
        btnCopyAdminUsername.classList.remove('copied');
      }, 2000);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = `@${ADMIN_USERNAME}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (copyBtnLabel) copyBtnLabel.textContent = '✅ Nusxalandi!';
      setTimeout(() => {
        if (copyBtnLabel) copyBtnLabel.textContent = '@akhrorov18 nusxalash';
      }, 2000);
    }
  });
}

// Telegram orqali to'g'ridan-to'g'ri adminga yozish (@akhrorov18)
if (btnOpenAdminTelegram) {
  btnOpenAdminTelegram.addEventListener('click', (e) => {
    e.preventDefault();
    const url = `https://t.me/${ADMIN_USERNAME}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  });
}

// Mini App ichidan taklif va talab yuborish
if (btnSubmitFeedback) {
  btnSubmitFeedback.addEventListener('click', async () => {
    const text = feedbackTextInput ? feedbackTextInput.value.trim() : '';

    if (!text) {
      showFeedbackAlert('Iltimos, taklif yoki talabingizni yozing!', 'error');
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
      return;
    }

    if (text.length < 3) {
      showFeedbackAlert('Xabar juda qisqa. Batafsilroq yozing!', 'error');
      return;
    }

    btnSubmitFeedback.disabled = true;
    btnSubmitFeedback.innerHTML = '<span>⏳ Yuborilmoqda...</span>';

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          username: currentUsername,
          firstName: currentFirstName,
          message: text,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedbackAlert('✅ ' + (data.message || 'Taklifingiz adminga yetkazildi! Rahmat!'), 'success');
        if (feedbackTextInput) feedbackTextInput.value = '';
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      } else {
        showFeedbackAlert('❌ ' + (data.error || 'Yuborishda xatolik yuz berdi.'), 'error');
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
      }
    } catch (err) {
      showFeedbackAlert('❌ Server bilan bog\'lanishda xatolik yuz berdi.', 'error');
    } finally {
      btnSubmitFeedback.disabled = false;
      btnSubmitFeedback.innerHTML = '<span>🚀 Adminga yuborish</span>';
    }
  });
}

function showFeedbackAlert(msg, type = 'success') {
  if (!feedbackAlertBox) return;
  feedbackAlertBox.className = `feedback-alert ${type}`;
  feedbackAlertBox.textContent = msg;
  feedbackAlertBox.classList.remove('hidden');

  setTimeout(() => {
    feedbackAlertBox.classList.add('hidden');
  }, 6000);
}

// ================================================================
// 16. SLAYDLARNI JONLI KO'RISH KARUSELI (SLIDE PREVIEWER)
// ================================================================
let activePreviewIndex = 0;
let activeSlidesList = [];

const previewSlideCounter = document.getElementById('previewSlideCounter');
const previewSlideNum = document.getElementById('previewSlideNum');
const previewSlideTitle = document.getElementById('previewSlideTitle');
const previewSlideBullets = document.getElementById('previewSlideBullets');
const previewSlideHighlight = document.getElementById('previewSlideHighlight');
const previewHighlightText = document.getElementById('previewHighlightText');
const previewDotsContainer = document.getElementById('previewDotsContainer');
const btnPrevSlide = document.getElementById('btnPrevSlide');
const btnNextSlide = document.getElementById('btnNextSlide');

function initSlidePreview(slides) {
  if (!slides || !slides.length) return;
  activeSlidesList = slides;
  activePreviewIndex = 0;

  // Dots yasash
  if (previewDotsContainer) {
    previewDotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `preview-dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        activePreviewIndex = idx;
        renderSlideCard(activePreviewIndex);
      });
      previewDotsContainer.appendChild(dot);
    });
  }

  renderSlideCard(0);
}

function renderSlideCard(index) {
  if (!activeSlidesList.length || index < 0 || index >= activeSlidesList.length) return;
  const slide = activeSlidesList[index];

  if (previewSlideCounter) {
    previewSlideCounter.textContent = `${index + 1} / ${activeSlidesList.length}`;
  }
  if (previewSlideNum) {
    previewSlideNum.textContent = `${index + 1}-slayd`;
  }
  if (previewSlideTitle) {
    previewSlideTitle.textContent = slide.title || 'Slayd';
  }

  // Nuqtalar (Bullet points / Content)
  if (previewSlideBullets) {
    previewSlideBullets.innerHTML = '';
    const points = slide.points || slide.bulletPoints || slide.content || [];
    if (Array.isArray(points)) {
      points.forEach(pt => {
        const item = document.createElement('div');
        item.className = 'preview-bullet-item';
        if (pt && typeof pt === 'object') {
          const heading = pt.heading ? `<b>${pt.heading}:</b> ` : '';
          const desc = pt.description || '';
          item.innerHTML = `<span class="bullet-ico">🔹</span><div>${heading}<span>${desc}</span></div>`;
        } else {
          item.innerHTML = `<span class="bullet-ico">🔹</span><span>${pt}</span>`;
        }
        previewSlideBullets.appendChild(item);
      });
    } else if (typeof points === 'string') {
      const p = document.createElement('p');
      p.className = 'preview-bullet-text';
      p.textContent = points;
      previewSlideBullets.appendChild(p);
    }
  }

  // Xulosa (Highlight)
  if (previewSlideHighlight && previewHighlightText) {
    if (slide.highlight) {
      previewHighlightText.textContent = slide.highlight;
      previewSlideHighlight.classList.remove('hidden');
    } else {
      previewSlideHighlight.classList.add('hidden');
    }
  }

  // Dots aktivlashtirish
  if (previewDotsContainer) {
    const dots = previewDotsContainer.querySelectorAll('.preview-dot');
    dots.forEach((d, i) => {
      if (i === index) d.classList.add('active');
      else d.classList.remove('active');
    });
  }

  // Tugmalar holati
  if (btnPrevSlide) btnPrevSlide.disabled = index === 0;
  if (btnNextSlide) btnNextSlide.disabled = index === activeSlidesList.length - 1;
}

if (btnPrevSlide) {
  btnPrevSlide.addEventListener('click', () => {
    if (activePreviewIndex > 0) {
      activePreviewIndex--;
      renderSlideCard(activePreviewIndex);
      if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
    }
  });
}

if (btnNextSlide) {
  btnNextSlide.addEventListener('click', () => {
    if (activePreviewIndex < activeSlidesList.length - 1) {
      activePreviewIndex++;
      renderSlideCard(activePreviewIndex);
      if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
    }
  });
}

// ================================================================
// 17. HIMOYA NUTQI (SPEAKER SPEECH) AKKORDEON
// ================================================================
let activeSpeechNotes = [];
let activePresentationTitle = '';

const btnToggleSpeech = document.getElementById('btnToggleSpeech');
const speechAccordionBody = document.getElementById('speechAccordionBody');
const speechArrowIcon = document.getElementById('speechArrowIcon');
const speechSlidesList = document.getElementById('speechSlidesList');
const btnCopyAllSpeech = document.getElementById('btnCopyAllSpeech');
const btnDownloadSpeechTxt = document.getElementById('btnDownloadSpeechTxt');

if (btnToggleSpeech && speechAccordionBody) {
  btnToggleSpeech.addEventListener('click', () => {
    const isHidden = speechAccordionBody.classList.contains('hidden');
    if (isHidden) {
      speechAccordionBody.classList.remove('hidden');
      if (speechArrowIcon) speechArrowIcon.textContent = '▲';
    } else {
      speechAccordionBody.classList.add('hidden');
      if (speechArrowIcon) speechArrowIcon.textContent = '▼';
    }
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  });
}

function initSpeechNotes(notes, title = 'Taqdimot') {
  activePresentationTitle = title;
  activeSpeechNotes = notes || [];

  if (!speechSlidesList) return;
  speechSlidesList.innerHTML = '';

  activeSpeechNotes.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'speech-card-item';
    const num = item.slideNumber || idx + 1;
    const cardTitle = item.title || `${num}-slayd`;
    const noteText = item.notes || item.speakerNotes || 'Ushbu slayd uchun asosiy tushuntirish va taqdimot nutqi.';

    card.innerHTML = `
      <div class="speech-card-top">
        <span class="speech-badge">${num}-slayd</span>
        <span class="speech-heading">${cardTitle}</span>
      </div>
      <p class="speech-text">"${noteText}"</p>
    `;
    speechSlidesList.appendChild(card);
  });
}

// Barcha nutqdan nusxa olish
if (btnCopyAllSpeech) {
  btnCopyAllSpeech.addEventListener('click', async () => {
    if (!activeSpeechNotes.length) return;

    let fullText = `🎙 TAQDIMOT HIMOYA NUTQI:\n📌 Mavzu: ${activePresentationTitle}\n\n`;
    activeSpeechNotes.forEach((item, idx) => {
      const num = item.slideNumber || idx + 1;
      const cardTitle = item.title || `${num}-slayd`;
      const noteText = item.notes || item.speakerNotes || '';
      fullText += `[${num}-slayd: ${cardTitle}]\n${noteText}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(fullText.trim());
      btnCopyAllSpeech.textContent = '✅ Barcha nutq nusxalandi!';
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      setTimeout(() => {
        btnCopyAllSpeech.textContent = '📋 Barcha nutqdan nusxa olish';
      }, 2500);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = fullText.trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btnCopyAllSpeech.textContent = '✅ Barcha nutq nusxalandi!';
      setTimeout(() => {
        btnCopyAllSpeech.textContent = '📋 Barcha nutqdan nusxa olish';
      }, 2500);
    }
  });
}

// Matn (.txt) yuklab olish
if (btnDownloadSpeechTxt) {
  btnDownloadSpeechTxt.addEventListener('click', () => {
    if (!activeSpeechNotes.length) return;

    let fullText = `🎙 TAQDIMOT HIMOYA NUTQI:\n📌 Mavzu: ${activePresentationTitle}\n\n`;
    activeSpeechNotes.forEach((item, idx) => {
      const num = item.slideNumber || idx + 1;
      const cardTitle = item.title || `${num}-slayd`;
      const noteText = item.notes || item.speakerNotes || '';
      fullText += `[${num}-slayd: ${cardTitle}]\n${noteText}\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `himoya_nutqi_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  });
}

// ================================================================
// 18. TELEGRAM KANAL A'ZOLIGI BONUSA (+2 KOIN)
// ================================================================
const btnJoinChannelLink = document.getElementById('btnJoinChannelLink');
if (btnJoinChannelLink) {
  btnJoinChannelLink.addEventListener('click', (e) => {
    e.preventDefault();
    const chUrl = 'https://t.me/ahroriAI';
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(chUrl);
    } else {
      window.open(chUrl, '_blank');
    }
  });
}

const btnVerifyChannel = document.getElementById('btnVerifyChannel');
const channelBonusStatus = document.getElementById('channelBonusStatus');

if (btnVerifyChannel) {
  btnVerifyChannel.addEventListener('click', async () => {
    if (!currentUserId) {
      if (tg?.showAlert) tg.showAlert('Iltimos, Telegram orqali kiring!');
      else alert('Iltimos, Telegram orqali kiring!');
      return;
    }

    btnVerifyChannel.disabled = true;
    btnVerifyChannel.textContent = '⏳ Tekshirilmoqda...';

    try {
      const res = await fetch('/api/check-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      const data = await res.json();
      if (channelBonusStatus) {
        channelBonusStatus.classList.remove('hidden');
        if (data.success) {
          channelBonusStatus.className = 'channel-bonus-status success';
          channelBonusStatus.textContent = '🎉 ' + data.message;
          btnVerifyChannel.textContent = '✅ Bonus olingan (+2 koin)';
          btnVerifyChannel.classList.add('claimed');
          if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
          // Balansni yangilash
          fetchUserData();
        } else if (data.alreadyClaimed) {
          channelBonusStatus.className = 'channel-bonus-status info';
          channelBonusStatus.textContent = 'ℹ️ ' + data.message;
          btnVerifyChannel.textContent = '✅ Bonus olingan (+2 koin)';
          btnVerifyChannel.classList.add('claimed');
        } else {
          channelBonusStatus.className = 'channel-bonus-status error';
          channelBonusStatus.textContent = '⚠️ ' + (data.message || 'Kanalga a\'zo bo\'lmadingiz.');
          btnVerifyChannel.disabled = false;
          btnVerifyChannel.textContent = '✅ A\'zolikni tekshirish';
          if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
        }
      }
    } catch (err) {
      if (channelBonusStatus) {
        channelBonusStatus.classList.remove('hidden');
        channelBonusStatus.className = 'channel-bonus-status error';
        channelBonusStatus.textContent = '❌ Server bilan bog\'lanishda xatolik';
      }
      btnVerifyChannel.disabled = false;
      btnVerifyChannel.textContent = '✅ A\'zolikni tekshirish';
    }
  });
}


