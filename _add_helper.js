const fs = require('fs');
let content = fs.readFileSync('js/app.js', 'utf8');

const block = `
// ── Global async-button helper ────────────────────────────────
window.app_asyncButton = function(btn) {
  var el = typeof btn === 'string' ? document.querySelector(btn) : btn;
  if (!el) return function(){};
  var wasDisabled = el.disabled;
  el.disabled = true;
  el.classList.add('btn-loading');
  return function() {
    el.disabled = wasDisabled;
    el.classList.remove('btn-loading');
  };
};

// ── Auto-sync disabled buttons to loading spinner via CSS class ──
(function() {
  if (typeof window !== 'undefined' && window.MutationObserver) {
    var obs = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'disabled') {
          if (m.target.disabled) m.target.classList.add('btn-loading');
          else m.target.classList.remove('btn-loading');
        }
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var node = m.addedNodes[j];
            if (node.nodeType === 1) {
              if (node.disabled) node.classList.add('btn-loading');
              var disabledEls = node.querySelectorAll('button:disabled, .btn:disabled');
              for (var k = 0; k < disabledEls.length; k++) disabledEls[k].classList.add('btn-loading');
            }
          }
        }
      }
    });
    function attach() {
      if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['disabled'], subtree: true, childList: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
    else attach();
  }
})();

`;

// Find the ── Initialization section
const idx = content.indexOf('// ── Initialization');
if (idx === -1) { console.log('marker not found'); process.exit(1); }

content = content.slice(0, idx) + block + content.slice(idx);
fs.writeFileSync('js/app.js', content, 'utf8');
console.log('Done');
