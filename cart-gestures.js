(function () {
  function initCartGestures() {
    var drawer = document.getElementById("cartDrawer");
    var close = document.getElementById("closeCart");
    var handle = drawer && drawer.querySelector(".cart-drag-handle");
    if (!drawer || !handle || drawer.dataset.gesturesReady === "1") return;
    drawer.dataset.gesturesReady = "1";
    if (close) close.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.closeCart === "function") window.closeCart();
      else { drawer.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("open"); document.body.style.overflow = ""; }
    }, true);
    var startY = 0, lastY = 0, dragging = false;
    handle.addEventListener("pointerdown", function (e) {
      if (!drawer.classList.contains("open")) return;
      dragging = true; startY = e.clientY; lastY = e.clientY;
      drawer.classList.add("cart-dragging");
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      lastY = e.clientY;
      var delta = Math.max(0, lastY - startY);
      drawer.style.transform = "translateY(" + delta + "px)";
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false; drawer.classList.remove("cart-dragging");
      var delta = Math.max(0, lastY - startY);
      drawer.style.transform = "";
      if (delta > 72) {
        if (typeof window.closeCart === "function") window.closeCart();
        else { drawer.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("open"); document.body.style.overflow = ""; }
      }
      try { if (e && e.pointerId != null) handle.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCartGestures);
  else initCartGestures();
  window.addEventListener("load", initCartGestures);
})();
