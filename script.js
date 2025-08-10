/* ---------- helpers ---------- */
const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

/* ---------- state ---------- */
let currentDayIndex = 0; // 0 = Mon, 1 = Tue, etc.
let currentProgramId = 'ppl';

/* ---------- DOM elements ---------- */
const dayButtonsContainer = qs('#day-buttons-container');
const workoutDisplay = qs('#workout-display');
const selectPplBtn = qs('#select-ppl');
const selectMeganBtn = qs('#select-megan');
const messageCloseBtn = qs('#message-close');

/* ---------- Workout Programs Data ---------- */
const workoutPrograms = {
    'ppl': {
        name: 'JUNIOR (Push/Pull/Legs)',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        plan: {
            'Mon': 'Push',
            'Tue': 'Pull',
            'Wed': 'Legs',
            'Thu': 'Push',
            'Fri': 'Pull',
            'Sat': 'Legs'
        },
        workouts: {
            'Push': [
                'Flat Barbell Bench Press (4x 8-12 reps)',
                'Incline Dumbbell Press (3x 10-15 reps)',
                'Cable Flys (3x 12-15 reps)',
                'Seated Overhead Dumbbell Press (4x 8-12 reps)',
                'Lateral Raises (3x 12-15 reps)',
                'Tricep Pushdowns (3x 10-15 reps)',
                'Overhead Tricep Extension (3x 12-15 reps)'
            ],
            'Pull': [
                'Weighted Pull-ups (4x 6-10 reps)',
                'Barbell Rows (3x 8-12 reps)',
                'Lat Pulldowns (3x 10-15 reps)',
                'Seated Cable Rows (3x 10-15 reps)',
                'Barbell Bicep Curls (3x 12-15 reps)',
                'Hammer Curls (3x 12-15 reps)',
                'Face Pulls (3x 15-20 reps)'
            ],
            'Legs': [
                'Barbell Squats (4x 6-10 reps)',
                'Leg Press (3x 8-12 reps)',
                'Romanian Deadlifts (3x 8-12 reps)',
                'Leg Extensions (3x 12-15 reps)',
                'Leg Curls (3x 12-15 reps)',
                'Calf Raises (4x 15-20 reps)'
            ]
        }
    },
    'megan': {
        name: 'MEGAN\'S WORKOUT',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        plan: {
            'Mon': 'Glute & Ham Focus',
            'Tue': 'Upper Body & Core',
            'Wed': 'Quad & Glute Focus',
            'Thu': 'Lower Body (Accessory)',
            'Fri': 'Upper Body & Core',
            'Sat': 'Full Lower Body (Volume)'
        },
        workouts: {
            'Glute & Ham Focus': [
                'Barbell Hip Thrust (4x 8-12 reps)',
                'Romanian Deadlift (RDL) (3x 8-12 reps)',
                'Cable Pull-Through (3x 12-15 reps)',
                'Leg Curl (Seated or Lying) (3x 10-15 reps)',
                'Glute Medius Kickback (Cable) (3x 15-20 reps)'
            ],
            'Upper Body & Core': [
                'Dumbbell Bench Press (4x 8-12 reps)',
                'Lat Pulldown (3x 10-15 reps)',
                'Seated Dumbbell Shoulder Press (3x 10-15 reps)',
                'Cable Row (3x 10-15 reps)',
                'Bicep Curl (Dumbbell or Barbell) (3x 12-15 reps)',
                'Triceps Pushdown (Rope) (3x 12-15 reps)',
                'Plank (3x 45-60 sec hold)'
            ],
            'Quad & Glute Focus': [
                'Barbell Back Squat (4x 6-10 reps)',
                'Leg Press (3x 8-12 reps)',
                'Walking Lunges (Dumbbell) (3x 10-12 reps per leg)',
                'Leg Extension (3x 12-15 reps)',
                'Cable Glute Kickback (3x 15-20 reps per leg)'
            ],
            'Lower Body (Accessory)': [
                'Goblet Squat (3x 10-15 reps)',
                'Single-Leg RDL (Dumbbell) (3x 10-12 reps per leg)',
                'Hyperextension (Glute Focused) (3x 12-15 reps)',
                'Seated Hip Abduction (Machine) (3x 15-20 reps)',
                'Standing Calf Raise (4x 15-20 reps)'
            ],
            'Full Lower Body (Volume)': [
                'Hack Squat (Machine) (4x 10-15 reps)',
                'Glute Ham Raise (GHR) or Nordic Hamstring Curl (3x 8-12 reps)',
                'Leg Press (Close Stance) (3x 12-15 reps)',
                'Leg Extensions (3x 15-20 reps)',
                'Seated Hip Abduction (3x 20-25 reps)',
                'Standing Calf Raises (4x 15-20 reps)'
            ]
        }
    }
};

// Custom message box functions
function showMessageBox(message) {
    const msgBox = qs('#message-box');
    const msgText = qs('#message-text');
    msgText.textContent = message;
    msgBox.style.backgroundColor = '#f44336';
    msgBox.style.display = 'flex';
    setTimeout(hideMessageBox, 4000);
}

function hideMessageBox() {
    const msgBox = qs('#message-box');
    msgBox.style.display = 'none';
}

/* ---------- main functions ---------- */

function renderDayButtons() {
    dayButtonsContainer.innerHTML = '';
    const days = workoutPrograms[currentProgramId].days;
    
    days.forEach((dayName, index) => {
        const button = document.createElement('button');
        button.classList.add('day-btn');
        if (index === currentDayIndex) {
            button.classList.add('active');
        }
        button.textContent = dayName;
        button.dataset.dayIndex = index;
        dayButtonsContainer.appendChild(button);

        button.addEventListener('click', () => {
            qsa('.day-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentDayIndex = parseInt(button.dataset.dayIndex);
            renderWorkoutPlan();
        });
    });
}

function renderWorkoutPlan() {
    const currentProgram = workoutPrograms[currentProgramId];
    const dayName = currentProgram.days[currentDayIndex];
    const workoutTitle = currentProgram.plan[dayName];
    const exercises = currentProgram.workouts[workoutTitle];
    
    let html = `<h4 class="text-xl font-bold text-gray-800 mb-4">${workoutTitle}</h4>`;
    html += `<ul class="list-disc pl-5 space-y-2 text-gray-700">`;
    exercises.forEach(exercise => {
        html += `<li>${exercise}</li>`;
    });
    html += `</ul>`;
    
    workoutDisplay.innerHTML = html;
}

function switchProgram(programId) {
    currentProgramId = programId;
    qsa('.program-selector-button').forEach(btn => btn.classList.remove('active'));
    qs(`#select-${programId}`).classList.add('active');
    renderDayButtons();
    renderWorkoutPlan();
}

/* ---------- event listeners ---------- */
document.addEventListener('DOMContentLoaded', () => {
    // Program selector button listeners
    selectPplBtn.addEventListener('click', () => switchProgram('ppl'));
    selectMeganBtn.addEventListener('click', () => switchProgram('megan'));

    // Message box close button listener
    messageCloseBtn.addEventListener('click', hideMessageBox);

    // Initialize with the default program (PPL)
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday
    currentDayIndex = today === 0 ? 0 : today - 1; // 0-indexed for Mon-Sat array
    switchProgram('ppl');
});
