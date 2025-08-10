/* ─── global pastel-purple theme ───────────────────────── */
:root {
    --accent: #9d7dff;
    --accent-dark: #7c5dff;
    --bg: #f3f0ff;
    --text: #333;
}

body {
    font-family: 'Inter', system-ui, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
}

h1 {
    font-family: 'Dancing Script', cursive;
    font-size: 2.2rem;
    margin-top: 0;
    color: var(--accent-dark);
}

/* General card styling for main content area */
.main-card {
    max-width: 900px;
    width: 100%;
    background: #fff;
    border-radius: 14px;
    padding: 2rem 2.2rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, .08);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
}

/* floating sparkles on card hover */
.main-card:hover::before,
.main-card:hover::after {
    opacity: .25;
    transform: translateY(-6px);
}

.main-card::before,
.main-card::after {
    content: '✨';
    position: absolute;
    font-size: 1.3rem;
    opacity: 0;
    transition: .6s;
    pointer-events: none;
}

.main-card::before {
    top: 10px;
    left: 20px;
}

.main-card::after {
    bottom: 10px;
    right: 20px;
}

/* Nav & sections */
.nav-link {
    transition: color .2s, box-shadow .2s;
    position: relative;
}
.nav-link:hover {
    color: var(--accent-dark);
}
.nav-link.active {
    color: var(--accent);
    font-weight: bold;
}
.nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--accent);
    border-radius: 1px;
}

/* Day navigation buttons */
.day-nav {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: .5rem;
    margin-bottom: 1.5rem;
}
.day-btn {
    background: #f0f0f0;
    border: none;
    padding: .5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: .85rem;
    font-weight: 500;
    transition: background .2s, color .2s, box-shadow .2s;
}
.day-btn:hover {
    background: #e5e5e5;
}
.day-btn.active {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 12px rgba(157, 125, 255, .3);
}

/* Program selector buttons */
.program-selector-button {
    transition: background-color 0.3s, color 0.3s, transform 0.2s;
    background-color: #f0f0f0;
    color: #555;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.program-selector-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.program-selector-button.active {
    background-color: var(--accent);
    color: white;
    box-shadow: 0 4px 12px rgba(157, 125, 255, 0.3);
}

/* Message box */
#message-box {
    display: none;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336; /* Red for errors */
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    font-weight: 500;
    font-size: 1rem;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

#message-close {
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.2s;
}

#message-close:hover {
    color: white;
}
