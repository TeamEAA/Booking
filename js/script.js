// ==========================================
// ★設定：GASのウェブアプリURLをここに貼る
// ==========================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx_wz9l14u8bXOIsNraNOPXUv2_6zLxzm4AfY6kAptQp0oaNqgAHRAoy9-XK04CXED4/exec";
// ==========================================

window.onload = loadSlots;

// データを取得して表示する
async function loadSlots() {
    const app = document.getElementById('app');
    
    try {
        if (GAS_API_URL.includes("xxxxxxxx")) {
            throw new Error("URLが設定されていません。js/script.js を編集してください。");
        }

        console.log("通信開始: " + GAS_API_URL);
        
        const response = await fetch(GAS_API_URL + "?action=getSlots");
        
        if (!response.ok) {
            throw new Error(`通信エラー: ${response.status} ${response.statusText}`);
        }

        const slots = await response.json();
        console.log("データ受信:", slots);
        
        renderSlots(slots);

    } catch (e) {
        console.error(e);
        // エラーを画面に出す（デバッグ用）
        app.innerHTML = `
            <div class="alert alert-danger">
                <strong>エラーが発生しました😭</strong><br>
                ${e.message}<br>
                <small>※GASのデプロイ設定が「全員」になっているか、URLが合っているか確認してください。</small>
            </div>
        `;
        document.getElementById('debug-area').style.display = 'block';
        document.getElementById('debug-area').innerText = "詳細エラー: " + e.stack;
    }
}

// HTMLを生成する
function renderSlots(slots) {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (!slots || slots.length === 0) {
        app.innerHTML = '<div class="alert alert-secondary text-center">現在、募集中の枠はありません。</div>';
        return;
    }

    slots.forEach(slot => {
        const remain = slot.max - slot.current;
        const isFull = remain <= 0;
        
        // メンバーHTML生成
        let membersHtml = slot.members.length > 0 
            ? slot.members.map(m => `<span class="member-pill">${escapeHtml(m.name)} <span class="role-tag">${escapeHtml(m.role)}</span></span>`).join('')
            : '<small class="text-muted ms-1">まだ誰もいません</small>';

        // カード生成
        const card = document.createElement('div');
        card.className = 'slot-card';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0 fw-bold text-dark">${slot.display}</h5>
                <span class="badge ${isFull ? 'bg-secondary' : 'bg-primary'}">
                    ${isFull ? '満員' : 'あと ' + remain + ' 名'}
                </span>
            </div>
            <div class="mb-3">
                <small class="text-muted">参加メンバー:</small><br>
                <div class="mt-1">${membersHtml}</div>
            </div>
            ${!isFull ? `
                <div class="mt-3 pt-3 border-top row g-2">
                    <div class="col-5"><input type="text" class="form-control form-control-sm" id="name-${slot.id}" placeholder="名前"></div>
                    <div class="col-4">
                        <select class="form-select form-select-sm" id="role-${slot.id}">
                            <option value="ALL">何でも</option>
                            <option value="DPS">DPS</option>
                            <option value="Tank">Tank</option>
                            <option value="Healer">Healer</option>
                        </select>
                    </div>
                    <div class="col-3"><button onclick="book('${slot.id}', '${slot.display}')" class="btn btn-success btn-sm w-100">参加</button></div>
                </div>
            ` : '<button class="btn btn-light w-100 text-muted" disabled>満員</button>'}
        `;
        app.appendChild(card);
    });
}

// 予約処理
async function book(slotId, displayTime) {
    const name = document.getElementById(`name-${slotId}`).value;
    const role = document.getElementById(`role-${slotId}`).value;
    
    if (!name) return alert("名前を入力してください");
    if (!confirm(`${displayTime} に参加しますか？`)) return;

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        // GASへの送信
        await fetch(GAS_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slotId, displayTime, userName: name, role })
        });
        
        alert("送信しました！(反映まで数秒かかります)");
        setTimeout(loadSlots, 2000); 
        
    } catch (e) {
        alert("送信エラー: " + e.message);
        btn.disabled = false;
        btn.innerText = "参加";
    }
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : '';
}
