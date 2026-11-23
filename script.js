/* NORME. demo store data — 다음 주 DB 연동 시 이 영역의 데이터를 테이블로 이전하세요. */
const products = [
  { id: 1, name: "FORM RING", category: "Ring", price: 189000, stock: 30, material: "925 Sterling Silver", description: "입체적인 볼륨과 매끄러운 곡선이 조화를 이루는 조형적 실버 링입니다.", image: "./img/product-1.svg", badge: "BEST" },
  { id: 2, name: "LINE RING", category: "Ring", price: 139000, stock: 25, material: "925 Sterling Silver", description: "간결한 선으로 완성한 오픈 링. 단독으로도 레이어드로도 자연스럽습니다.", image: "./img/product-2.svg", badge: "NEW" },
  { id: 3, name: "SIGNET RING", category: "Ring", price: 199000, stock: 20, material: "925 Sterling Silver", description: "절제된 면과 균형 잡힌 비율이 돋보이는 모던 시그넷 링입니다.", image: "./img/product-3.svg", badge: "" },
  { id: 4, name: "AXIS NECKLACE", category: "Necklace", price: 179000, stock: 15, material: "925 Sterling Silver / 42cm", description: "기하학적인 펜던트가 중심을 잡아주는 데일리 네크리스입니다.", image: "./img/product-4.svg", badge: "NEW" },
  { id: 5, name: "LINK NECKLACE", category: "Necklace", price: 249000, stock: 18, material: "925 Sterling Silver / 45cm", description: "서로 연결된 볼륨 링크가 단정하면서도 분명한 존재감을 만듭니다.", image: "./img/product-5.svg", badge: "" },
  { id: 6, name: "TRACE BRACELET", category: "Bracelet", price: 149000, stock: 25, material: "925 Sterling Silver / 17cm + 3cm", description: "가느다란 실루엣과 은은한 광택으로 매일 착용하기 좋은 브레이슬릿입니다.", image: "./img/product-6.svg", badge: "" },
  { id: 7, name: "CURVE CUFF", category: "Bracelet", price: 229000, stock: 12, material: "925 Sterling Silver", description: "유기적인 곡선과 여백을 살린 오픈 커프 브레이슬릿입니다.", image: "./img/product-7.svg", badge: "SIGNATURE" },
  { id: 8, name: "OBJECT BRACELET", category: "Bracelet", price: 159000, stock: 20, material: "925 Sterling Silver", description: "작은 실버 오브제가 이어지는 미니멀 체인 브레이슬릿입니다.", image: "./img/product-8.svg", badge: "" }
];
const memberGrades = [
  { name: "WELCOME", minSpend: 0, rate: 0.01 },
  { name: "SILVER", minSpend: 300000, rate: 0.03 },
  { name: "GOLD", minSpend: 700000, rate: 0.05 },
  { name: "BLACK", minSpend: 1500000, rate: 0.07 }
];
const SIGNUP_BONUS = 3000;
const STORAGE = { members: "norme_members", session: "norme_session", cart: "norme_cart", orders: "norme_orders", wishes: "norme_wishes" };

const readStore = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let members = readStore(STORAGE.members, []);
let currentUserId = readStore(STORAGE.session, null);
let cart = readStore(STORAGE.cart, []);
let orders = readStore(STORAGE.orders, []);
let wishes = readStore(STORAGE.wishes, []);
let activeCategory = "All";
let activeSlide = 0;
let slideTimer = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const money = (value) => "₩" + Number(value).toLocaleString("ko-KR");
const currentUser = () => members.find(m => m.id === currentUserId) || null;
const getGrade = (spent) => [...memberGrades].reverse().find(g => spent >= g.minSpend) || memberGrades[0];
const saveAll = () => {
  writeStore(STORAGE.members, members); writeStore(STORAGE.session, currentUserId);
  writeStore(STORAGE.cart, cart); writeStore(STORAGE.orders, orders); writeStore(STORAGE.wishes, wishes);
};
const showToast = (message) => {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
};
const openDrawer = (id) => { closeDrawers(); $("#" + id).classList.add("open"); $("#overlay").classList.add("open"); };
const closeDrawers = () => { document.querySelectorAll(".drawer").forEach(d => d.classList.remove("open")); $("#overlay").classList.remove("open"); };
const openModal = (id) => { $("#modalBackdrop").classList.add("open"); document.querySelectorAll(".modal").forEach(m => m.style.display = "none"); $("#" + id).style.display = "block"; };
const closeModal = () => { $("#modalBackdrop").classList.remove("open"); document.querySelectorAll(".modal").forEach(m => m.style.display = ""); };
const productById = id => products.find(p => p.id === Number(id));

function renderProducts() {
  const query = $("#productSearch").value.trim().toLowerCase();
  let list = products.filter(p => (activeCategory === "All" || p.category === activeCategory) && (p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)));
  const sort = $("#sortSelect").value;
  if (sort === "low") list.sort((a,b) => a.price-b.price);
  if (sort === "high") list.sort((a,b) => b.price-a.price);
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name));
  $("#productTotal").textContent = String(list.length).padStart(2,"0") + " PIECES";
  $("#emptyState").classList.toggle("hidden", list.length > 0);
  $("#productGrid").innerHTML = list.map(p => `
    <article class="product-card" data-product="${p.id}" tabindex="0" aria-label="${p.name} 상세 보기">
      <div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy">${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="wishlist ${wishes.includes(p.id) ? "active" : ""}" data-wish="${p.id}" aria-label="관심 상품 ${p.name}">${wishes.includes(p.id) ? "♥" : "♡"}</button>
      </div>
      <div class="product-info"><div><p class="product-name">${p.name}</p><span class="product-category">${p.category.toUpperCase()}</span></div><span class="product-price">${money(p.price)}</span></div>
    </article>`).join("");
}
function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cartCount").textContent = count; $("#drawerCartCount").textContent = `(${count})`;
  const total = cart.reduce((sum,item) => sum + productById(item.id).price * item.qty, 0);
  $("#cartSubtotal").textContent = money(total);
  $("#cartItems").innerHTML = cart.length ? cart.map(item => {
    const p = productById(item.id); if (!p) return "";
    return `<div class="cart-row"><img src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><p>${money(p.price)}</p><div class="qty-control"><button data-qty="${p.id}" data-delta="-1" aria-label="수량 줄이기">−</button><span>${item.qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="수량 늘리기">+</button></div></div><button class="remove-item" data-remove="${p.id}">삭제</button></div>`;
  }).join("") : `<p class="drawer-hint" style="text-align:center;padding:55px 0">장바구니가 비어 있습니다.</p>`;
  $("#checkoutButton").disabled = !cart.length;
  $("#checkoutButton").style.opacity = cart.length ? "1" : ".4";
}
function addToCart(id, qty=1) {
  const p = productById(id); if (!p) return;
  const existing = cart.find(i => i.id === p.id);
  if (existing) existing.qty = Math.min(p.stock, existing.qty + qty); else cart.push({id:p.id,qty:Math.min(p.stock,qty)});
  saveAll(); renderCart(); showToast("장바구니에 담았습니다.");
}
function renderAccount() {
  const user = currentUser();
  if (!user) {
    $("#accountContent").innerHTML = `<p class="drawer-hint" style="margin:25px 0">로그인 후 회원 정보와 주문 내역을 확인할 수 있습니다.</p><button class="primary-button" id="loginOpen">LOGIN</button><button class="secondary-button" id="signupOpen">CREATE ACCOUNT</button>`;
    return;
  }
  const grade = getGrade(user.totalSpent);
  const userOrders = orders.filter(o => o.userId === user.id);
  $("#accountContent").innerHTML = `<div class="account-card"><p class="eyebrow">WELCOME TO NORME.</p><h3>${escapeHtml(user.name)} 님</h3><p>${grade.name} MEMBER · ${Math.round(grade.rate*100)}% POINTS</p></div>
    <div class="account-stat"><span>보유 포인트</span><strong>${user.points.toLocaleString()} P</strong></div>
    <div class="account-stat"><span>누적 구매 금액</span><strong>${money(user.totalSpent)}</strong></div>
    <div class="account-stat"><span>관심 상품</span><strong>${wishes.length} ITEMS</strong></div>
    <div class="account-card"><p class="eyebrow">ORDER HISTORY</p>${userOrders.length ? userOrders.slice().reverse().map(o=>`<div class="order-entry"><strong>${o.orderNo}</strong><br>${o.items.map(i=>escapeHtml(i.name)+" × "+i.qty).join(", ")}<br>${money(o.total)} · ${o.date}</div>`).join("") : `<p>아직 주문 내역이 없습니다.</p>`}</div>
    <button class="secondary-button" id="logoutButton">LOG OUT</button>`;
}
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function showAuth(mode) {
  closeDrawers();
  const signup = mode === "signup";
  $("#authContent").innerHTML = `<p class="eyebrow">NORME. MEMBERSHIP</p><h2>${signup ? "Create account" : "Welcome back"}</h2><p class="subcopy">${signup ? "가입하고 3,000P 웰컴 포인트를 받아보세요." : "계정에 로그인해 주세요."}</p>
    <form id="authForm">
      ${signup ? `<div class="form-field"><label for="authName">NAME</label><input id="authName" name="name" required maxlength="30" autocomplete="name" placeholder="이름"></div>` : ""}
      <div class="form-field"><label for="authEmail">EMAIL</label><input id="authEmail" name="email" type="email" required autocomplete="email" placeholder="이메일"></div>
      <div class="form-field"><label for="authPassword">PASSWORD</label><input id="authPassword" name="password" type="password" required minlength="4" autocomplete="${signup?"new-password":"current-password"}" placeholder="비밀번호 (4자 이상)"></div>
      <p class="form-message" id="authMessage"></p><button class="primary-button" type="submit">${signup ? "SIGN UP" : "LOGIN"}</button>
    </form><p class="auth-switch">${signup ? "이미 계정이 있으신가요?" : "아직 회원이 아니신가요?"} <button id="authSwitch">${signup ? "로그인" : "회원가입"}</button></p>`;
  openModal("authModal");
  $("#authSwitch").addEventListener("click",()=>showAuth(signup?"login":"signup"));
  $("#authForm").addEventListener("submit", handleAuth);
}
function handleAuth(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget), email = String(data.get("email")).trim().toLowerCase(), password = String(data.get("password"));
  const message = $("#authMessage");
  if ($("#authName")) {
    if (members.some(m=>m.email===email)) { message.textContent = "이미 가입된 이메일입니다."; return; }
    const member = {id:"M"+Date.now(),name:String(data.get("name")).trim(),email,password,points:SIGNUP_BONUS,totalSpent:0,createdAt:new Date().toISOString()};
    members.push(member); currentUserId=member.id; saveAll(); closeModal(); renderAccount(); showToast("가입 완료! 3,000P가 지급되었습니다."); openDrawer("accountDrawer");
  } else {
    const member = members.find(m=>m.email===email && m.password===password);
    if (!member) { message.textContent = "이메일 또는 비밀번호를 확인해 주세요."; return; }
    currentUserId=member.id; saveAll(); closeModal(); renderAccount(); showToast("로그인되었습니다."); openDrawer("accountDrawer");
  }
}
function showProductDetail(id) {
  const p = productById(id); if (!p) return;
  $("#productDetail").innerHTML = `<div class="detail-layout"><img src="${p.image}" alt="${p.name}"><div class="detail-copy"><p class="eyebrow">${p.category.toUpperCase()} / NORME. OBJECTS</p><h2>${p.name}</h2><p class="detail-price">${money(p.price)}</p><p class="detail-description">${p.description}</p><div class="detail-meta"><span>MATERIAL</span><span>${p.material}</span></div><div class="detail-meta"><span>AVAILABILITY</span><span>${p.stock>0?"IN STOCK":"SOLD OUT"}</span></div><label for="detailQty">수량</label><select id="detailQty">${Array.from({length:Math.min(5,p.stock)},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("")}</select><button class="primary-button" id="detailAdd" ${p.stock===0?"disabled":""}>ADD TO BAG</button><button class="secondary-button" id="detailWish">${wishes.includes(p.id)?"♥ WISHLISTED":"♡ ADD TO WISHLIST"}</button><p class="drawer-hint">체험용 상품 정보이며 실제 판매·배송 상품이 아닙니다.</p></div></div>`;
  openModal("productModal");
  $("#detailAdd").addEventListener("click",()=>{addToCart(p.id,Number($("#detailQty").value));closeModal();openDrawer("cartDrawer");});
  $("#detailWish").addEventListener("click",()=>toggleWish(p.id));
}
function toggleWish(id) {
  if (wishes.includes(id)) wishes=wishes.filter(x=>x!==id); else wishes.push(id);
  saveAll(); renderProducts(); showToast(wishes.includes(id)?"관심 상품에 저장했습니다.":"관심 상품에서 삭제했습니다.");
  if ($("#productDetail").innerHTML.includes("detailWish")) $("#detailWish").textContent=wishes.includes(id)?"♥ WISHLISTED":"♡ ADD TO WISHLIST";
}
function showCheckout() {
  closeDrawers();
  if (!currentUser()) { showToast("체험 결제 전에 로그인해 주세요."); showAuth("login"); return; }
  const total=cart.reduce((sum,i)=>sum+productById(i.id).price*i.qty,0);
  $("#checkoutContent").innerHTML=`<p class="eyebrow">DEMO CHECKOUT</p><h2>Order summary</h2><p class="subcopy">실제 결제는 진행되지 않습니다. 체험 주문 내역만 생성됩니다.</p><div class="account-stat"><span>상품 합계</span><strong>${money(total)}</strong></div><div class="account-stat"><span>배송비</span><strong>FREE</strong></div><div class="account-stat"><span>결제 예정 금액</span><strong>${money(total)}</strong></div><div class="form-field"><label for="orderMemo">배송 요청사항 (선택)</label><input id="orderMemo" maxlength="80" placeholder="요청사항을 입력하세요"></div><button class="primary-button" id="confirmOrder">체험 주문하기</button>`;
  openModal("checkoutModal");
  $("#confirmOrder").addEventListener("click",completeOrder);
}
function completeOrder() {
  const user=currentUser(); if(!user || !cart.length) return;
  const items=cart.map(i=>({id:i.id,name:productById(i.id).name,price:productById(i.id).price,qty:i.qty}));
  const total=items.reduce((s,i)=>s+i.price*i.qty,0), grade=getGrade(user.totalSpent), earned=Math.floor(total*grade.rate);
  const order={orderNo:"NR"+Date.now().toString().slice(-9),userId:user.id,items,total,earned,date:new Date().toLocaleString("ko-KR"),memo:$("#orderMemo").value.trim(),status:"체험 주문 완료"};
  orders.push(order); user.totalSpent+=total; user.points+=earned; cart=[]; saveAll(); renderCart();
  $("#orderContent").innerHTML=`<p class="eyebrow">NORME. / ORDER COMPLETE</p><h2>Thank you.</h2><p class="subcopy">체험 주문이 정상적으로 생성되었습니다.</p><div class="account-stat"><span>주문 번호</span><strong>${order.orderNo}</strong></div><div class="account-stat"><span>주문 금액</span><strong>${money(total)}</strong></div><div class="account-stat"><span>적립 포인트</span><strong>+${earned.toLocaleString()}P</strong></div><p class="drawer-hint">실제 결제 및 배송은 진행되지 않습니다.</p><button class="primary-button" id="orderDone">확인</button>`;
  openModal("orderModal"); $("#orderDone").addEventListener("click",()=>{closeModal();renderAccount();openDrawer("accountDrawer");});
}
function startSlider() {
  const slides=[...document.querySelectorAll(".hero-slide")], dots=[...$("#slideDots").children];
  const show=(index)=>{activeSlide=index;slides.forEach((s,i)=>s.classList.toggle("active",i===index));dots.forEach((d,i)=>d.classList.toggle("active",i===index));};
  const restart=()=>{clearInterval(slideTimer);slideTimer=setInterval(()=>show((activeSlide+1)%slides.length),6000);};
  dots.forEach((dot,i)=>dot.addEventListener("click",()=>{show(i);restart();})); restart();
}

document.addEventListener("click", event => {
  const productCard=event.target.closest("[data-product]");
  const wish=event.target.closest("[data-wish]");
  if (wish) {event.stopPropagation();toggleWish(Number(wish.dataset.wish));return;}
  if (productCard) {showProductDetail(Number(productCard.dataset.product));return;}
  const qty=event.target.closest("[data-qty]");
  if(qty){const item=cart.find(i=>i.id===Number(qty.dataset.qty));const p=productById(item.id);item.qty=Math.max(1,Math.min(p.stock,item.qty+Number(qty.dataset.delta)));saveAll();renderCart();return;}
  const remove=event.target.closest("[data-remove]");
  if(remove){cart=cart.filter(i=>i.id!==Number(remove.dataset.remove));saveAll();renderCart();return;}
  const category=event.target.closest("[data-category]");
  if(category){activeCategory=category.dataset.category;document.querySelectorAll("[data-category]").forEach(b=>b.classList.toggle("active",b===category));renderProducts();return;}
  if(event.target.closest("[data-close]"))closeDrawers();
  if(event.target.closest("[data-modal-close]"))closeModal();
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){closeDrawers();closeModal();} if((event.key==="Enter"||event.key===" ")&&event.target.matches(".product-card")){showProductDetail(Number(event.target.dataset.product));}});
$("#searchToggle").addEventListener("click",()=>{openDrawer("searchDrawer");$("#drawerSearch").value=$("#productSearch").value;$("#drawerSearch").focus();});
$("#drawerSearch").addEventListener("input",e=>{$("#productSearch").value=e.target.value;renderProducts();});
$("#accountToggle").addEventListener("click",()=>{renderAccount();openDrawer("accountDrawer");});
$("#cartToggle").addEventListener("click",()=>{renderCart();openDrawer("cartDrawer");});
$("#overlay").addEventListener("click",closeDrawers);
$("#productSearch").addEventListener("input",renderProducts);
$("#sortSelect").addEventListener("change",renderProducts);
$("#checkoutButton").addEventListener("click",showCheckout);
$("#menuToggle").addEventListener("click",()=>$("#mobileMenu").classList.toggle("open"));
$("#mobileMenu").addEventListener("click",e=>{if(e.target.tagName==="A")$("#mobileMenu").classList.remove("open");});
document.addEventListener("click",e=>{
  if(e.target.id==="loginOpen")showAuth("login");
  if(e.target.id==="signupOpen")showAuth("signup");
  if(e.target.id==="logoutButton"){currentUserId=null;saveAll();renderAccount();showToast("로그아웃되었습니다.");}
});
document.addEventListener("DOMContentLoaded",()=>{renderProducts();renderCart();startSlider();});
