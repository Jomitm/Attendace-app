/**
 * CRWI Attendance Widget JS
 */

const firebaseConfig = {
    apiKey: "AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",
    authDomain: "crwiattendance.firebaseapp.com",
    projectId: "crwiattendance",
    storageBucket: "crwiattendance.firebasestorage.app",
    messagingSenderId: "462155106938",
    appId: "1:462155106938:web:18291b04a5a3bec185c9c3",
    measurementId: "G-X6W45TV4QR"
};

// State
let currentUser = null;
let currentPlans = null;

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const taskList = document.getElementById('task-list');
const noTasks = document.getElementById('no-tasks');
const dateLabel = document.getElementById('date-label');
const newTaskInput = document.getElementById('new-task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const popoutBtn = document.getElementById('popout-btn');
const loginBtn = document.getElementById('login-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const scheduleBtn = document.getElementById('schedule-btn');

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Set Date
const today = new Date().toISOString().split('T')[0];
dateLabel.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

// Listen for Auth State
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        startSync();
    } else {
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
        loadingOverlay.style.display = 'none';
    }
});

function startSync() {
    if (!currentUser) return;

    // Listen for Today's Work Plans
    db.collection('workPlans')
        .where('userId', '==', currentUser.uid)
        .where('date', '==', today)
        .onSnapshot(snapshot => {
            loadingOverlay.style.display = 'none';
            if (snapshot.empty) {
                renderTasks([]);
                currentPlans = null;
            } else {
                const planData = snapshot.docs[0].data();
                planData.id = snapshot.docs[0].id;
                currentPlans = planData;
                renderTasks(planData.plans || []);
            }
        }, err => {
            console.error("Sync error:", err);
            loadingOverlay.style.display = 'none';
        });
}

function renderTasks(plans) {
    taskList.innerHTML = '';
    if (plans.length === 0) {
        noTasks.style.display = 'block';
        return;
    }
    noTasks.style.display = 'none';

    plans.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        const isDone = task.status === 'completed';

        li.innerHTML = `
            <input type="checkbox" ${isDone ? 'checked' : ''} data-index="${index}">
            <div class="task-text" style="${isDone ? 'text-decoration: line-through; color: #94a3b8;' : ''}">
                ${task.task}
                ${task.subPlans && task.subPlans.length > 0 ? `<div style="font-size: 0.75rem; color: #64748b;">${task.subPlans.join(', ')}</div>` : ''}
            </div>
        `;

        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTask(index, checkbox.checked));

        taskList.appendChild(li);
    });
}

async function toggleTask(index, isDone) {
    if (!currentPlans) return;

    const updatedPlans = [...currentPlans.plans];
    updatedPlans[index].status = isDone ? 'completed' : 'pending';

    try {
        await db.collection('workPlans').doc(currentPlans.id).update({
            plans: updatedPlans
        });
    } catch (err) {
        console.error("Update error:", err);
    }
}

async function addNewTask() {
    const taskText = newTaskInput.value.trim();
    if (!taskText) return;

    newTaskInput.value = '';

    try {
        if (currentPlans) {
            const updatedPlans = [...currentPlans.plans, { task: taskText, status: 'pending', tags: [] }];
            await db.collection('workPlans').doc(currentPlans.id).update({
                plans: updatedPlans
            });
        } else {
            // Create new plan document for today
            await db.collection('workPlans').add({
                userId: currentUser.uid,
                userName: currentUser.displayName || 'User',
                date: today,
                plans: [{ task: taskText, status: 'pending', tags: [] }],
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (err) {
        console.error("Add error:", err);
    }
}

// Event Listeners
addTaskBtn.addEventListener('click', addNewTask);
newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewTask();
});

popoutBtn.addEventListener('click', () => {
    chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 360,
        height: 600
    });
});

loginBtn.addEventListener('click', () => {
    window.open("https://crwiattendance.web.app", "_blank");
});

checkoutBtn.addEventListener('click', () => {
    window.open("https://crwiattendance.web.app/#attendance", "_blank");
});

scheduleBtn.addEventListener('click', () => {
    window.open("https://crwiattendance.web.app/#annual-plan", "_blank");
});
