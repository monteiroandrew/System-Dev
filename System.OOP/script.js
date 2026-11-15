document.addEventListener('DOMContentLoaded', () => {

  const getUsers = () => JSON.parse(localStorage.getItem('attendify_users')) || [];
  const getStoredTeacherSections = () =>
    JSON.parse(localStorage.getItem('attendify_teacher_sections')) || [];
  const saveTeacherSections = (sections) => {
    localStorage.setItem('attendify_teacher_sections', JSON.stringify(sections));
  };

  const saveUser = (user) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('attendify_users', JSON.stringify(users));
  };

  const generateStudentID = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `STU-2026-${randomDigits}`;
  };

  const isInSubfolder = () => {
    return window.location.pathname.includes('/studentdb/') ||
           window.location.pathname.includes('/teacherdb/');
  };

  const getStudentDashboardPath = () => {
    const path = window.location.pathname;
    if (path.includes('/studentdb/')) return 'studentdb.html';
    if (path.includes('/teacherdb/')) return '../studentdb/studentdb.html';
    return 'studentdb/studentdb.html';
  };

  const getTeacherDashboardPath = () => {
    return window.location.pathname.includes('/teacherdb/')
      ? 'teacherdb.html'
      : 'teacherdb/teacherdb.html';
  };

  const getLoginPath = () => {
    return isInSubfolder() ? '../index.html' : 'index.html';
  };

  const getPhilippineDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  const formatPhilippineDateTime = timestamp => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  const formatPhilippineTime = timestamp => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const philippineTime = document.querySelector('#philippine-time');
  if (philippineTime) {
    const timeFormatter = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const dateFormatter = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const philippineDate = document.querySelector('#philippine-date');
    const updatePhilippineTime = () => {
      const now = new Date();
      philippineTime.textContent = timeFormatter.format(now);
      philippineTime.dateTime = now.toISOString();
      if (philippineDate) {
        philippineDate.textContent = dateFormatter.format(now);
        philippineDate.dateTime = getPhilippineDateKey(now);
      }
    };
    updatePhilippineTime();
    window.setInterval(updatePhilippineTime, 1000);
  }

  // --- Password Visibility Toggle ---
  const togglePassword = document.querySelector('#togglePassword');
  const passwordInput = document.querySelector('#password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.classList.toggle('fa-eye');
      togglePassword.classList.toggle('fa-eye-slash');
    });
  }

  // --- Role Selector (Student vs Teacher) ---
  const roleButtons = document.querySelectorAll('.role-btn');
  const emailLabel = document.querySelector('#email-label');
  const emailInput = document.querySelector('#email');
  let selectedRole = 'student';

  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      roleButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      selectedRole = button.getAttribute('data-role');
      if (emailLabel && emailInput) {
        if (selectedRole === 'teacher') {
          emailLabel.textContent = 'Teacher email';
          emailInput.placeholder = 'teacher@school.edu';
        } else {
          emailLabel.textContent = 'Student email';
          emailInput.placeholder = 'name@school.edu';
        }
      }
    });
  });

  // --- Signup Form Handler ---
  const signupForm = document.querySelector('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const lastName = document.querySelector('#last-name').value.trim();
      const firstName = document.querySelector('#first-name').value.trim();
      const middleInitial = document.querySelector('#middle-initial').value.trim();
      const email = document.querySelector('#email').value.trim().toLowerCase();
      const password = document.querySelector('#password').value;

      const users = getUsers();
      if (users.find(u => u.email === email)) {
        alert('An account with this email already exists!');
        return;
      }

      const newUser = {
        role: selectedRole,
        lastName,
        firstName,
        middleInitial,
        email,
        password,
        studentId: selectedRole === 'student' ? generateStudentID() : null
      };

      saveUser(newUser);
      localStorage.removeItem('attendify_current_user');
      alert('Account created successfully. Please sign in with your email and password.');
      window.location.href = 'index.html';
    });
  }

  // --- Login Form Handler ---
  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.querySelector('#email').value.trim().toLowerCase();
      const password = document.querySelector('#password').value;

      const users = getUsers();
      const matchedUser = users.find(u => u.email === email && u.password === password);

      if (!matchedUser) {
        alert('Invalid email or password.');
        return;
      }

      localStorage.setItem('attendify_current_user', JSON.stringify(matchedUser));

      if (matchedUser.role === 'student') {
        window.location.href = getStudentDashboardPath();
      } else {
        window.location.href = getTeacherDashboardPath();
      }
    });
  }

  // --- Student Dashboard Population (studentdb.html / joinclass.html / uploadphoto.html) ---
  const dashboardBody = document.querySelector('.dashboard-body');
  if (dashboardBody) {
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));

    if (!currentUser || currentUser.role !== 'student') {
      window.location.href = getLoginPath();
      return;
    }

    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();

    const dashFirstName = document.querySelector('#dash-first-name');
    const passStudentName = document.querySelector('#pass-student-name');
    const navUserName = document.querySelector('#nav-user-name');
    const passStudentId = document.querySelector('#pass-student-id');
    const profileStudentId = document.querySelector('#profile-student-id');
    const profileEmail = document.querySelector('#profile-email');

    if (dashFirstName) dashFirstName.textContent = currentUser.firstName;
    if (passStudentName) passStudentName.textContent = fullName;
    if (navUserName) navUserName.textContent = fullName;
    if (passStudentId) passStudentId.textContent = currentUser.studentId;
    if (profileStudentId) profileStudentId.textContent = currentUser.studentId;
    if (profileEmail) profileEmail.textContent = currentUser.email;

    const avatarContainer = document.querySelector('#user-avatar');
    if (avatarContainer) {
      if (currentUser.profilePic) {
        avatarContainer.innerHTML = `<img src="${currentUser.profilePic}" alt="${fullName}" />`;
      } else {
        avatarContainer.textContent = initials;
      }
    }

    const myClassesList = document.querySelector('#my-classes-list');
    if (myClassesList) {
      const sections = getStoredTeacherSections();
      const joinedSections = sections.filter(section =>
        (section.students || []).includes(currentUser.email)
      );
      const pendingSections = sections.filter(section =>
        (section.joinRequests || []).some(request =>
          request.email === currentUser.email && request.status === 'pending'
        )
      );
      myClassesList.replaceChildren();

      if (joinedSections.length === 0 && pendingSections.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-classes-card';
        const icon = document.createElement('div');
        icon.className = 'empty-icon-box';
        icon.innerHTML = '<i class="fa-regular fa-folder"></i>';
        const title = document.createElement('h4');
        title.textContent = 'You haven’t joined a class yet';
        const message = document.createElement('p');
        message.textContent = 'Ask your teacher for the class join code.';
        emptyState.append(icon, title, message);
        myClassesList.appendChild(emptyState);
      }

      pendingSections.forEach(section => {
        const card = document.createElement('article');
        card.className = 'student-class-card is-pending';
        const status = document.createElement('span');
        status.className = 'student-class-status';
        status.textContent = 'Awaiting teacher approval';
        const title = document.createElement('h4');
        title.textContent = section.subject;
        const details = document.createElement('p');
        details.textContent = `${section.courseCode} · ${section.section}`;
        const schedule = document.createElement('p');
        schedule.textContent = section.schedule || 'Schedule not set';
        card.append(status, title, details, schedule);
        myClassesList.appendChild(card);
      });

      joinedSections.forEach(section => {
        const card = document.createElement('a');
        card.className = 'student-class-card student-class-link';
        card.href = `attendance.html?section=${encodeURIComponent(section.id)}`;
        card.setAttribute('aria-label', `View attendance for ${section.subject}, ${section.section}`);
        const status = document.createElement('span');
        status.className = 'student-class-status is-enrolled';
        status.textContent = 'Enrolled';
        const title = document.createElement('h4');
        title.textContent = section.subject;
        const details = document.createElement('p');
        details.textContent = `${section.courseCode} · ${section.section}`;
        const schedule = document.createElement('p');
        schedule.textContent = section.schedule || 'Schedule not set';
        const teacher = document.createElement('p');
        const teacherUser = getUsers().find(user => user.email === section.teacherEmail);
        teacher.textContent = teacherUser
          ? `Teacher: ${teacherUser.firstName} ${teacherUser.lastName}`
          : 'Teacher';
        const action = document.createElement('span');
        action.className = 'student-class-card-action';
        action.innerHTML = 'View attendance <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        card.append(status, title, details, schedule, teacher, action);
        myClassesList.appendChild(card);
      });
    }

    // Render unique QR code
    const qrContainer = document.querySelector('#qrcode');
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      const qrValue = JSON.stringify({
        studentId: currentUser.studentId,
        name: fullName,
        email: currentUser.email
      });
      new QRCode(qrContainer, {
        text: qrValue,
        width: 140,
        height: 140,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      const expandQrButton = document.querySelector('#expand-student-qr');
      const qrDialog = document.querySelector('#student-qr-dialog');
      const expandedQrContainer = document.querySelector('#expanded-qrcode');
      const closeQrButton = document.querySelector('#close-student-qr');
      const expandedStudentName = document.querySelector('#student-qr-title');
      const expandedStudentId = document.querySelector('#student-qr-id');
      if (expandedStudentName) expandedStudentName.textContent = fullName;
      if (expandedStudentId) {
        expandedStudentId.textContent = `ID: ${currentUser.studentId || 'ID unavailable'}`;
      }
      if (expandQrButton && qrDialog && expandedQrContainer && closeQrButton) {
        let expandedQrCreated = false;
        expandQrButton.addEventListener('click', () => {
          if (!expandedQrCreated) {
            new QRCode(expandedQrContainer, {
              text: qrValue,
              width: 260,
              height: 260,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.H
            });
            expandedQrCreated = true;
          }
          qrDialog.showModal();
        });
        closeQrButton.addEventListener('click', () => qrDialog.close());
        qrDialog.addEventListener('click', event => {
          if (event.target === qrDialog) qrDialog.close();
        });
        qrDialog.addEventListener('close', () => expandQrButton.focus());
      }
    }

    // Sign out handler
    const btnSignout = document.querySelector('#btn-signout');
    if (btnSignout) {
      btnSignout.addEventListener('click', () => {
        localStorage.removeItem('attendify_current_user');
        window.location.href = getLoginPath();
      });
    }
  }

  // --- Student Joined Sections (sectionst.html) ---
  const studentSectionsPage = document.querySelector('.student-sections-page');
  if (studentSectionsPage) {
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
    if (!currentUser || currentUser.role !== 'student') {
      window.location.href = getLoginPath();
      return;
    }

    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    document.querySelector('#nav-user-name').textContent = fullName;
    document.querySelector('#user-avatar').textContent =
      `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();

    const signOutButton = document.querySelector('#btn-signout');
    signOutButton.addEventListener('click', () => {
      localStorage.removeItem('attendify_current_user');
      window.location.href = getLoginPath();
    });

    const sectionsList = document.querySelector('#student-sections-list');
    const enrolledSections = getStoredTeacherSections().filter(section =>
      (section.students || []).includes(currentUser.email)
    );
    if (enrolledSections.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-classes-card';
      const icon = document.createElement('div');
      icon.className = 'empty-icon-box';
      icon.innerHTML = '<i class="fa-regular fa-folder"></i>';
      const title = document.createElement('h4');
      title.textContent = 'No classes yet';
      const message = document.createElement('p');
      message.textContent = 'Join a class with a code from your teacher. Your classes will appear here after approval.';
      const joinLink = document.createElement('a');
      joinLink.className = 'btn-join-class';
      joinLink.href = 'joinclass.html';
      joinLink.textContent = 'Join a class';
      emptyState.append(icon, title, message, joinLink);
      sectionsList.appendChild(emptyState);
    } else {
      const users = getUsers();
      enrolledSections.forEach(section => {
        const sessions = section.attendanceSessions || [];
        const studentStatuses = sessions
          .map(session => session.statuses && session.statuses[currentUser.email])
          .filter(status => ['present', 'late', 'absent'].includes(status));
        const presentCount = studentStatuses.filter(status => status === 'present').length;
        const lateCount = studentStatuses.filter(status => status === 'late').length;
        const absentCount = studentStatuses.filter(status => status === 'absent').length;
        const markedCount = presentCount + lateCount + absentCount;
        const attendanceRate = markedCount
          ? Math.round(((presentCount + lateCount) / markedCount) * 100)
          : 0;
        const teacher = users.find(user => user.email === section.teacherEmail);

        const card = document.createElement('a');
        card.className = 'student-section-card student-section-link';
        card.href = `attendance.html?section=${encodeURIComponent(section.id)}`;
        card.setAttribute('aria-label', `View attendance for ${section.subject}, ${section.section}`);
        const cardHeader = document.createElement('div');
        cardHeader.className = 'student-section-card-header';
        const icon = document.createElement('span');
        icon.className = `student-section-icon ${section.iconColor || 'green'}`;
        icon.innerHTML = '<i class="fa-regular fa-folder"></i>';
        const courseCode = document.createElement('span');
        courseCode.className = 'course-pill';
        courseCode.textContent = section.courseCode;
        cardHeader.append(icon, courseCode);

        const sectionName = document.createElement('p');
        sectionName.className = 'section-label';
        sectionName.textContent = section.section;
        const courseName = document.createElement('h2');
        courseName.textContent = section.subject;
        const schedule = document.createElement('p');
        schedule.className = 'student-section-meta';
        schedule.textContent = section.schedule || 'Schedule not set';
        const teacherName = document.createElement('p');
        teacherName.className = 'student-section-meta';
        teacherName.textContent = teacher
          ? `Teacher: ${teacher.firstName} ${teacher.lastName}`
          : 'Teacher information unavailable';

        const attendance = document.createElement('div');
        attendance.className = 'student-section-attendance';
        const attendanceHeading = document.createElement('strong');
        attendanceHeading.textContent = 'Attendance';
        const attendanceCounts = document.createElement('p');
        attendanceCounts.textContent = `${presentCount} present · ${lateCount} late · ${absentCount} absent`;
        const progress = document.createElement('div');
        progress.className = 'student-section-progress';
        const progressFill = document.createElement('span');
        progressFill.style.width = `${attendanceRate}%`;
        progress.appendChild(progressFill);
        const rate = document.createElement('span');
        rate.className = 'student-section-rate';
        rate.textContent = markedCount ? `${attendanceRate}% attendance` : 'No attendance recorded';
        attendance.append(attendanceHeading, attendanceCounts, progress, rate);

        const action = document.createElement('span');
        action.className = 'student-section-card-action';
        action.innerHTML = 'View attendance calendar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        card.append(cardHeader, sectionName, courseName, schedule, teacherName, attendance, action);
        sectionsList.appendChild(card);
      });
    }
  }

  // --- Student class attendance calendar ---
  const studentAttendancePage = document.querySelector('.student-attendance-page');
  if (studentAttendancePage) {
    const params = new URLSearchParams(window.location.search);
    const sectionId = params.get('section');
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
    const section = getStoredTeacherSections().find(item =>
      item.id === sectionId &&
      (item.students || []).includes(currentUser.email)
    );
    const attendanceContent = document.querySelector('#student-attendance-content');
    const emptyMessage = document.querySelector('#student-attendance-empty');

    if (!section) {
      attendanceContent.hidden = true;
      emptyMessage.hidden = false;
      emptyMessage.textContent = 'This class is unavailable or you are not enrolled in it.';
    } else {
      document.querySelector('#student-attendance-title').textContent = section.subject;
      document.querySelector('#student-attendance-meta').textContent =
        `${section.courseCode} · ${section.section} · ${section.schedule || 'Schedule not set'}`;

      const monthTitle = document.querySelector('#student-calendar-month-title');
      const daysGrid = document.querySelector('#student-calendar-days-grid');
      const previousButton = document.querySelector('#student-calendar-previous');
      const nextButton = document.querySelector('#student-calendar-next');
      const currentMonthParts = getPhilippineDateKey().slice(0, 7).split('-').map(Number);
      const currentMonth = new Date(currentMonthParts[0], currentMonthParts[1] - 1, 1);
      const displayMonth = new Date(currentMonth);

      const renderCalendar = () => {
        const year = displayMonth.getFullYear();
        const monthIndex = displayMonth.getMonth();
        const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstWeekday = new Date(year, monthIndex, 1).getDay();
        const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
        const statusesByDate = {};
        const timesByDate = {};

        (section.attendanceSessions || []).forEach(session => {
          if (!session.date || !session.date.startsWith(`${monthKey}-`)) return;
          const status = session.statuses && session.statuses[currentUser.email];
          if (['present', 'late', 'absent'].includes(status)) {
            statusesByDate[session.date] = status;
            timesByDate[session.date] =
              session.statusTimes && session.statusTimes[currentUser.email];
          } else {
            delete statusesByDate[session.date];
            delete timesByDate[session.date];
          }
        });

        const counts = { present: 0, late: 0, absent: 0 };
        let cells = '<div class="cal-cell"></div>'.repeat(firstWeekday);
        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
          const status = statusesByDate[dateKey];
          const timestamp = timesByDate[dateKey];
          if (status) counts[status] += 1;
          const label = status ? `, ${status}` : ', no attendance record';
          const recordedAt = timestamp ? `, ${formatPhilippineDateTime(timestamp)}` : '';
          cells += `
            <div class="cal-cell${status ? ` status-${status}` : ''}"
              aria-label="${dateKey}${label}${recordedAt}" title="${dateKey}${label}${recordedAt}">
              <span class="cal-day-num">${day}</span>
              ${status ? `<span class="cal-status-text">${status}</span>` : ''}
              ${timestamp ? `<span class="cal-status-time">${formatPhilippineTime(timestamp)}</span>` : ''}
            </div>
          `;
        }
        cells += '<div class="cal-cell"></div>'.repeat(totalCells - firstWeekday - daysInMonth);
        daysGrid.innerHTML = cells;
        monthTitle.textContent = new Intl.DateTimeFormat('en-PH', {
          month: 'long',
          year: 'numeric'
        }).format(displayMonth);

        document.querySelector('#student-summary-present').textContent = counts.present;
        document.querySelector('#student-summary-late').textContent = counts.late;
        document.querySelector('#student-summary-absent').textContent = counts.absent;
        const hasRecords = counts.present + counts.late + counts.absent > 0;
        document.querySelector('#student-attendance-no-records').hidden = hasRecords;
        nextButton.disabled = displayMonth >= currentMonth;
      };

      previousButton.addEventListener('click', () => {
        displayMonth.setMonth(displayMonth.getMonth() - 1);
        renderCalendar();
      });
      nextButton.addEventListener('click', () => {
        if (displayMonth >= currentMonth) return;
        displayMonth.setMonth(displayMonth.getMonth() + 1);
        renderCalendar();
      });
      renderCalendar();
    }
  }

  // --- Join Class Form Submit (joinclass.html) ---
  const joinClassForm = document.querySelector('#join-class-form');
  if (joinClassForm) {
    joinClassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.querySelector('#class-code').value.trim().toUpperCase();
      const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
      const sections = getStoredTeacherSections();
      const section = sections.find(item => item.joinCode && item.joinCode.toUpperCase() === code);

      if (!section) {
        alert('No section was found for that join code.');
        return;
      }

      section.students = section.students || [];
      if (section.students.includes(currentUser.email)) {
        alert('You are already enrolled in this section.');
        return;
      }

      section.joinRequests = section.joinRequests || [];
      const existingRequest = section.joinRequests.find(request =>
        request.email === currentUser.email &&
        (request.status === 'pending' || request.status === 'approved')
      );
      if (existingRequest) {
        alert(existingRequest.status === 'approved'
          ? 'You are already enrolled in this section.'
          : 'Your request to join this section is awaiting approval.');
        return;
      }

      section.joinRequests.push({
        email: currentUser.email,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      saveTeacherSections(sections);
      alert(`Your request to join ${section.subject} · ${section.section} has been sent.`);
      window.location.href = 'studentdb.html';
    });
  }

  // --- Upload Photo Page (uploadphoto.html) ---
  const uploadPhotoForm = document.querySelector('#upload-photo-form');
  if (uploadPhotoForm) {
    const fileInput = document.querySelector('#photo-file-input');
    const selectBtn = document.querySelector('#btn-select-photo');
    const saveBtn = document.querySelector('#btn-save-photo');
    const previewCircle = document.querySelector('#preview-avatar-circle');
    let base64PhotoData = null;

    selectBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          base64PhotoData = event.target.result;
          previewCircle.innerHTML = `<img src="${base64PhotoData}" alt="Preview" />`;
          saveBtn.removeAttribute('disabled');
        };
        reader.readAsDataURL(file);
      }
    });

    uploadPhotoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!base64PhotoData) return;

      const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
      if (currentUser) {
        currentUser.profilePic = base64PhotoData;
        localStorage.setItem('attendify_current_user', JSON.stringify(currentUser));

        const users = getUsers();
        const index = users.findIndex(u => u.email === currentUser.email);
        if (index !== -1) {
          users[index].profilePic = base64PhotoData;
          localStorage.setItem('attendify_users', JSON.stringify(users));
        }

        alert('Profile picture updated!');
        window.location.href = 'studentdb.html';
      }
    });
  }

  // --- Teacher Section Details and Attendance (sections.html) ---
  const sectionDetailsPage = document.querySelector('.section-details-page');
  if (sectionDetailsPage) {
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
    if (!currentUser || currentUser.role !== 'teacher') {
      window.location.href = getLoginPath();
      return;
    }

    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    document.querySelector('#nav-user-name').textContent = fullName;
    document.querySelector('#user-avatar').textContent =
      `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();

    const sectionId = new URLSearchParams(window.location.search).get('id');
    let sections = getStoredTeacherSections();
    let section = sections.find(item =>
      item.id === sectionId &&
      (!item.teacherEmail || item.teacherEmail === currentUser.email)
    );
    const detailsContent = document.querySelector('#section-details-content');

    const signOutButton = document.querySelector('#btn-signout');
    signOutButton.addEventListener('click', () => {
      localStorage.removeItem('attendify_current_user');
      window.location.href = getLoginPath();
    });

    if (!section) {
      detailsContent.innerHTML = `
        <div class="section-not-found">
          <h1>Section not found</h1>
          <p>This section may have been deleted or is not available to your account.</p>
          <a href="teacherdb.html" class="attendance-primary-button">Back to sections</a>
        </div>
      `;
      return;
    }

    const users = getUsers();
    const searchInput = document.querySelector('#student-search');
    const statusFilter = document.querySelector('#student-status-filter');
    const studentRows = document.querySelector('#student-attendance-rows');
    const attendanceButton = document.querySelector('#start-attendance');
    const attendanceNotice = document.querySelector('#attendance-notice');
    const joinRequestList = document.querySelector('#join-request-list');
    const joinRequestCount = document.querySelector('#join-request-count');
    const joinRequestsToggle = document.querySelector('#join-requests-toggle');
    const joinRequestsPanel = document.querySelector('#join-requests-panel');
    const checkinModal = document.querySelector('#attendance-checkin-modal');
    const videoElement = document.querySelector('#attendance-camera');
    const videoFrame = document.querySelector('.checkin-video-frame');
    const cameraPlaceholder = document.querySelector('#camera-placeholder');
    const cameraStatus = document.querySelector('#camera-status');
    const manualStatus = document.querySelector('#manual-status');
    const manualCheckinForm = document.querySelector('#manual-mode-panel');
    const manualCheckinInput = document.querySelector('#student-checkin-code');
    const scanModePanel = document.querySelector('#scan-mode-panel');
    const endAttendanceButton = document.querySelector('#end-attendance');
    const openCameraButton = document.querySelector('#open-camera');
    const scanResult = document.querySelector('#scan-result');
    const scannedStudentName = document.querySelector('#scanned-student-name');
    const scannedStudentTime = document.querySelector('#scanned-student-time');
    const scanResultStatus = document.querySelector('#scan-result-status');
    const markScannedPresentButton = document.querySelector('#mark-scanned-present');
    const markScannedLateButton = document.querySelector('#mark-scanned-late');
    const scanNextStudentButton = document.querySelector('#scan-next-student');
    let cameraStream = null;
    let scanFrame = null;
    let qrDetector = null;
    let pendingScan = null;
    const qrCanvas = document.createElement('canvas');
    const qrCanvasContext = qrCanvas.getContext('2d', { willReadFrequently: true });

    joinRequestsToggle.addEventListener('click', () => {
      const isExpanded = joinRequestsToggle.getAttribute('aria-expanded') === 'true';
      joinRequestsToggle.setAttribute('aria-expanded', String(!isExpanded));
      joinRequestsPanel.hidden = isExpanded;
    });

    document.addEventListener('click', event => {
      if (!joinRequestsPanel.contains(event.target) && !joinRequestsToggle.contains(event.target)) {
        joinRequestsPanel.hidden = true;
        joinRequestsToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !joinRequestsPanel.hidden) {
        joinRequestsPanel.hidden = true;
        joinRequestsToggle.setAttribute('aria-expanded', 'false');
        joinRequestsToggle.focus();
      }
    });
    const todayLabel = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium'
    }).format(new Date());

    const persistSections = () => {
      saveTeacherSections(sections);
      section = sections.find(item => item.id === sectionId);
    };

    const getTodaySession = () => {
      const sessions = section.attendanceSessions || [];
      return [...sessions].reverse().find(session => session.date === getPhilippineDateKey());
    };

    const stopCamera = () => {
      if (scanFrame !== null) {
        cancelAnimationFrame(scanFrame);
        scanFrame = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      videoElement.srcObject = null;
      cameraPlaceholder.hidden = false;
      openCameraButton.disabled = false;
    };

    const closeCheckinDialog = () => {
      checkinModal.hidden = true;
      stopCamera();
    };

    const openCheckinDialog = () => {
      if (!getTodaySession()?.active) {
        section.attendanceSessions = section.attendanceSessions || [];
        section.attendanceSessions.push({
          id: `session-${Date.now()}`,
          date: getPhilippineDateKey(),
          startedAt: new Date().toISOString(),
          active: true,
          statusTimes: {},
          statuses: Object.fromEntries((section.students || []).map(email => [email, 'unmarked']))
        });
        persistSections();
        renderAttendance();
      }
      checkinModal.hidden = false;
      document.querySelector('#choose-scan-mode').click();
      document.querySelector('#choose-scan-mode').focus();
    };

    const finishAttendance = () => {
      const currentSession = getTodaySession();
      if (currentSession && currentSession.active) {
        currentSession.active = false;
        currentSession.endedAt = new Date().toISOString();
        persistSections();
        renderAttendance();
      }
      closeCheckinDialog();
    };

    const getStudentForCheckIn = code => {
      const normalizedCode = code.trim().toLowerCase();
      const student = users.find(user =>
        user.email.toLowerCase() === normalizedCode ||
        (user.studentId && user.studentId.toLowerCase() === normalizedCode)
      );
      if (!student || !(section.students || []).includes(student.email)) {
        return {
          success: false,
          message: 'Student not found in this section. Check the code or approve their join request first.'
        };
      }

      const session = getTodaySession();
      if (!session || !session.active) {
        return { success: false, message: 'Attendance is not active. Start a session and try again.' };
      }
      return { success: true, student, session };
    };

    const recordStudentAttendance = (student, session, status, markedAt) => {
      if (!session.active) {
        return { success: false, message: 'This attendance session has ended. Start a new session to make changes.' };
      }
      session.statuses = session.statuses || {};
      session.statusTimes = session.statusTimes || {};
      session.statuses[student.email] = status;
      session.statusTimes[student.email] = markedAt.toISOString();
      persistSections();
      renderAttendance();
      return { success: true, message: `${student.firstName} ${student.lastName} marked ${status}.` };
    };

    const checkInStudent = code => {
      const result = getStudentForCheckIn(code);
      if (!result.success) return result;
      return recordStudentAttendance(result.student, result.session, 'present', new Date());
    };

    const saveScannedAttendance = status => {
      if (!pendingScan) return;
      const { student, session, scannedAt } = pendingScan;
      const result = recordStudentAttendance(student, session, status, scannedAt);
      scanResultStatus.textContent = result.success
        ? `${result.message} ${formatPhilippineDateTime(scannedAt)}`
        : result.message;
      scanResultStatus.classList.toggle('is-success', result.success);
      if (result.success) {
        markScannedPresentButton.disabled = true;
        markScannedLateButton.disabled = true;
        scanNextStudentButton.hidden = false;
        pendingScan = null;
      }
    };

    const decodeStudentQr = rawValue => {
      try {
        const payload = JSON.parse(rawValue);
        return payload.studentId || payload.email || '';
      } catch {
        return rawValue;
      }
    };

    const scanForQr = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraStatus.textContent = 'Camera access is unavailable. Open this page over HTTPS or localhost, or enter the student code instead.';
        return;
      }
      if (!('BarcodeDetector' in window) && typeof window.jsQR !== 'function') {
        cameraStatus.textContent = 'QR scanning support could not be loaded. Check your connection or enter the student code instead.';
        return;
      }

      scanResult.hidden = true;
      scanResultStatus.textContent = '';
      scanResultStatus.classList.remove('is-success');
      pendingScan = null;
      videoFrame.hidden = false;
      openCameraButton.disabled = true;
      try {
        qrDetector = null;
        if ('BarcodeDetector' in window) {
          try {
            qrDetector = new BarcodeDetector({ formats: ['qr_code'] });
          } catch (error) {
            if (typeof window.jsQR !== 'function') throw error;
          }
        }
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (!qrDetector && (!qrCanvasContext || typeof window.jsQR !== 'function')) {
          throw new Error('The QR decoder is unavailable in this browser.');
        }
        videoElement.srcObject = cameraStream;
        await videoElement.play();
        cameraPlaceholder.hidden = true;
        cameraStatus.textContent = 'Point the camera at a student’s Attendify QR code.';

        const scanFrameForCode = async () => {
          if (!cameraStream || checkinModal.hidden) return;
          try {
            let rawValue = '';
            if (qrDetector) {
              const codes = await qrDetector.detect(videoElement);
              rawValue = codes.length > 0 ? codes[0].rawValue : '';
            } else if (videoElement.videoWidth && videoElement.videoHeight) {
              qrCanvas.width = videoElement.videoWidth;
              qrCanvas.height = videoElement.videoHeight;
              qrCanvasContext.drawImage(videoElement, 0, 0, qrCanvas.width, qrCanvas.height);
              const image = qrCanvasContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
              const code = window.jsQR(image.data, image.width, image.height, {
                inversionAttempts: 'attemptBoth'
              });
              rawValue = code ? code.data : '';
            }
            if (!cameraStream || checkinModal.hidden) return;
            if (rawValue) {
              const result = getStudentForCheckIn(decodeStudentQr(rawValue));
              cameraStatus.textContent = result.message || 'QR code scanned. Choose Present or Late.';
              if (result.success) {
                const scannedAt = new Date();
                pendingScan = {
                  student: result.student,
                  session: result.session,
                  scannedAt
                };
                scannedStudentName.textContent =
                  `${result.student.firstName} ${result.student.lastName}`;
                scannedStudentTime.textContent = formatPhilippineDateTime(scannedAt);
                markScannedPresentButton.disabled = false;
                markScannedLateButton.disabled = false;
                scanNextStudentButton.hidden = true;
                scanResult.hidden = false;
                openCameraButton.hidden = true;
                stopCamera();
                videoFrame.hidden = true;
                return;
              }
            }
          } catch (error) {
            cameraStatus.textContent = `Unable to scan this QR code: ${error.message}`;
            stopCamera();
            return;
          }
          scanFrame = requestAnimationFrame(scanFrameForCode);
        };
        scanFrame = requestAnimationFrame(scanFrameForCode);
      } catch (error) {
        stopCamera();
        cameraStatus.textContent = ['NotAllowedError', 'SecurityError'].includes(error.name)
          ? 'Camera permission was denied or unavailable. Use HTTPS or localhost, allow camera access, or enter the student code instead.'
          : `Could not open the camera: ${error.message}`;
      }
    };

    document.querySelector('#close-checkin').addEventListener('click', closeCheckinDialog);
    checkinModal.addEventListener('click', event => {
      if (event.target === checkinModal) closeCheckinDialog();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !checkinModal.hidden) closeCheckinDialog();
    });

    document.querySelector('#choose-scan-mode').addEventListener('click', event => {
      event.currentTarget.classList.add('is-selected');
      document.querySelector('#choose-manual-mode').classList.remove('is-selected');
      scanModePanel.hidden = false;
      manualCheckinForm.hidden = true;
      scanResult.hidden = true;
      videoFrame.hidden = false;
      openCameraButton.hidden = false;
      pendingScan = null;
      stopCamera();
      cameraStatus.textContent = 'Allow camera access to scan student QR codes.';
    });

    document.querySelector('#choose-manual-mode').addEventListener('click', event => {
      event.currentTarget.classList.add('is-selected');
      document.querySelector('#choose-scan-mode').classList.remove('is-selected');
      scanModePanel.hidden = true;
      manualCheckinForm.hidden = false;
      scanResult.hidden = true;
      openCameraButton.hidden = false;
      pendingScan = null;
      stopCamera();
      manualCheckinInput.focus();
    });

    openCameraButton.addEventListener('click', scanForQr);
    markScannedPresentButton.addEventListener('click', () => saveScannedAttendance('present'));
    markScannedLateButton.addEventListener('click', () => saveScannedAttendance('late'));
    scanNextStudentButton.addEventListener('click', () => {
      scanResult.hidden = true;
      videoFrame.hidden = false;
      openCameraButton.hidden = false;
      scanForQr();
    });
    endAttendanceButton.addEventListener('click', finishAttendance);
    manualCheckinForm.addEventListener('submit', event => {
      event.preventDefault();
      const result = checkInStudent(manualCheckinInput.value);
      manualStatus.textContent = result.message;
      manualStatus.classList.toggle('is-success', result.success);
      if (result.success) manualCheckinInput.value = '';
    });

    const getStudentName = email => {
      const user = users.find(item => item.email === email);
      return user ? `${user.firstName} ${user.lastName}` : email;
    };

    const renderJoinRequests = () => {
      const pendingRequests = (section.joinRequests || []).filter(request =>
        request.status === 'pending'
      );
      joinRequestCount.textContent = pendingRequests.length;
      joinRequestList.replaceChildren();

      if (pendingRequests.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'join-request-empty';
        empty.textContent = 'No pending join requests.';
        joinRequestList.appendChild(empty);
        return;
      }

      pendingRequests.forEach(request => {
        const user = users.find(item => item.email === request.email);
        const card = document.createElement('article');
        card.className = 'join-request-item';
        const details = document.createElement('div');
        details.className = 'join-request-student';
        const initials = document.createElement('span');
        initials.className = 'student-initials';
        initials.textContent = user
          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
          : request.email.charAt(0).toUpperCase();
        const identity = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = getStudentName(request.email);
        const email = document.createElement('small');
        email.textContent = request.email;
        identity.append(name, email);
        details.append(initials, identity);

        const actions = document.createElement('div');
        actions.className = 'join-request-actions';
        const rejectButton = document.createElement('button');
        rejectButton.type = 'button';
        rejectButton.className = 'join-request-reject';
        rejectButton.textContent = 'Decline';
        rejectButton.addEventListener('click', () => {
          request.status = 'rejected';
          request.respondedAt = new Date().toISOString();
          persistSections();
          renderJoinRequests();
        });
        const approveButton = document.createElement('button');
        approveButton.type = 'button';
        approveButton.className = 'join-request-approve';
        approveButton.textContent = 'Approve';
        approveButton.addEventListener('click', () => {
          section.students = section.students || [];
          if (!section.students.includes(request.email)) {
            section.students.push(request.email);
          }
          section.studentsCount = section.students.length;
          request.status = 'approved';
          request.respondedAt = new Date().toISOString();
          persistSections();
          renderJoinRequests();
          renderAttendance();
        });
        actions.append(rejectButton, approveButton);
        card.append(details, actions);
        joinRequestList.appendChild(card);
      });
    };

    const appendCell = (row, value, className) => {
      const cell = document.createElement('td');
      if (className) cell.className = className;
      cell.textContent = value;
      row.appendChild(cell);
      return cell;
    };

    const renderAttendance = () => {
      const roster = section.students || [];
      const sessions = section.attendanceSessions || [];
      const todaySession = getTodaySession();
      const todayStatuses = todaySession ? todaySession.statuses : {};
      const allStatusCounts = { present: 0, late: 0, absent: 0 };
      sessions.forEach(session => {
        Object.values(session.statuses || {}).forEach(status => {
          if (Object.prototype.hasOwnProperty.call(allStatusCounts, status)) {
            allStatusCounts[status] += 1;
          }
        });
      });

      const todayCounts = { present: 0, late: 0, absent: 0 };
      Object.values(todayStatuses || {}).forEach(status => {
        if (Object.prototype.hasOwnProperty.call(todayCounts, status)) {
          todayCounts[status] += 1;
        }
      });

      const markedCount = allStatusCounts.present + allStatusCounts.late + allStatusCounts.absent;
      const attendanceRate = markedCount
        ? Math.round(((allStatusCounts.present + allStatusCounts.late) / markedCount) * 100)
        : 0;
      document.querySelector('#students-count').textContent = roster.length;
      document.querySelector('#present-count').textContent = todayCounts.present;
      document.querySelector('#late-count').textContent = todayCounts.late;
      document.querySelector('#absent-count').textContent = todayCounts.absent;
      document.querySelector('#attendance-rate').textContent = `${attendanceRate}%`;
      document.querySelector('#attendance-progress').style.width = `${attendanceRate}%`;
      document.querySelector('#recorded-count').textContent =
        `${sessions.length} ${sessions.length === 1 ? 'class' : 'classes'} recorded`;
      document.querySelector('#today-date').textContent = todayLabel;
      attendanceButton.innerHTML = todaySession && todaySession.active
        ? '<i class="fa-solid fa-camera"></i> Attendance in progress'
        : '<i class="fa-solid fa-plus"></i> Start attendance';
      attendanceButton.classList.toggle('is-active', Boolean(todaySession && todaySession.active));
      attendanceNotice.textContent = todaySession && todaySession.active
        ? 'Attendance is in progress. Update each student’s status below.'
        : 'Start attendance to record today’s student status.';

      const query = searchInput.value.trim().toLowerCase();
      const filter = statusFilter.value;
      studentRows.replaceChildren();

      const visibleRoster = roster.filter(email => {
        const name = getStudentName(email);
        const status = todayStatuses[email] || 'unmarked';
        const matchesSearch = `${name} ${email}`.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || status === filter;
        return matchesSearch && matchesFilter;
      });

      if (visibleRoster.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'attendance-empty-row';
        cell.textContent = roster.length
          ? 'No students match your search or filter.'
          : 'No students have joined this section yet. Share the join code above.';
        row.appendChild(cell);
        studentRows.appendChild(row);
        return;
      }

      visibleRoster.forEach(email => {
        const name = getStudentName(email);
        const student = users.find(user => user.email === email);
        const row = document.createElement('tr');
        const identityCell = document.createElement('td');
        identityCell.className = 'student-identity';
        const avatar = document.createElement('span');
        avatar.className = 'student-initials';
        avatar.textContent = name.split(/\s+/).map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
        const identity = document.createElement('span');
        const studentName = document.createElement('strong');
        studentName.textContent = name;
        const studentId = document.createElement('small');
        studentId.textContent = student && student.studentId ? student.studentId : email;
        identity.append(studentName, studentId);
        const attendanceLink = document.createElement('a');
        const attendanceParams = new URLSearchParams({
          section: sectionId,
          email,
          name,
          id: student && student.studentId ? student.studentId : email
        });
        attendanceLink.className = 'student-identity-link';
        attendanceLink.href = `studentatt.html?${attendanceParams.toString()}`;
        attendanceLink.setAttribute('aria-label', `View ${name}'s monthly attendance`);
        attendanceLink.append(avatar, identity);
        identityCell.appendChild(attendanceLink);
        row.appendChild(identityCell);

        const presentTotal = sessions.filter(session => session.statuses?.[email] === 'present').length;
        const lateTotal = sessions.filter(session => session.statuses?.[email] === 'late').length;
        const absentTotal = sessions.filter(session => session.statuses?.[email] === 'absent').length;
        const studentMarked = presentTotal + lateTotal + absentTotal;
        const rate = studentMarked
          ? Math.round(((presentTotal + lateTotal) / studentMarked) * 100)
          : 0;
        appendCell(row, String(presentTotal), 'attendance-present-count');
        appendCell(row, String(lateTotal), 'attendance-late-count');
        appendCell(row, String(absentTotal), 'attendance-absent-count');
        const rateCell = appendCell(row, '', 'attendance-rate-cell');
        const rateBar = document.createElement('span');
        rateBar.className = 'attendance-rate-bar';
        const rateFill = document.createElement('span');
        rateFill.style.width = `${rate}%`;
        rateBar.appendChild(rateFill);
        const rateLabel = document.createElement('strong');
        rateLabel.textContent = `${rate}%`;
        rateCell.append(rateBar, rateLabel);

        const todayCell = document.createElement('td');
        const todayStatus = todayStatuses[email] || 'unmarked';
        const statusSelect = document.createElement('select');
        statusSelect.className = `attendance-status-select status-${todayStatus}`;
        statusSelect.setAttribute('aria-label', `Today's attendance for ${name}`);
        [
          ['unmarked', 'Not marked'],
          ['present', 'Present'],
          ['late', 'Late'],
          ['absent', 'Absent']
        ].forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          option.selected = value === todayStatus;
          statusSelect.appendChild(option);
        });
        statusSelect.disabled = !(todaySession && todaySession.active);
        statusSelect.addEventListener('change', () => {
          todaySession.statuses[email] = statusSelect.value;
          todaySession.statusTimes = todaySession.statusTimes || {};
          if (statusSelect.value === 'unmarked') {
            delete todaySession.statusTimes[email];
          } else if (!todaySession.statusTimes[email]) {
            todaySession.statusTimes[email] = new Date().toISOString();
          }
          persistSections();
          renderAttendance();
        });
        todayCell.appendChild(statusSelect);
        const statusTime = todaySession && todaySession.statusTimes && todaySession.statusTimes[email];
        if (statusTime) {
          const timestamp = document.createElement('small');
          timestamp.className = 'attendance-status-time';
          timestamp.textContent = formatPhilippineDateTime(statusTime);
          todayCell.appendChild(timestamp);
        }
        row.appendChild(todayCell);

        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'attendance-remove-button';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          if (!window.confirm(`Remove ${name} from this section?`)) return;
          section.students = section.students.filter(item => item !== email);
          section.attendanceSessions = (section.attendanceSessions || []).map(session => {
            const statuses = { ...session.statuses };
            delete statuses[email];
            return { ...session, statuses };
          });
          section.studentsCount = section.students.length;
          persistSections();
          renderAttendance();
        });
        actionCell.appendChild(removeButton);
        row.appendChild(actionCell);
        studentRows.appendChild(row);
      });
    };

    document.querySelector('#section-course-code').textContent = section.courseCode;
    document.querySelector('#section-label').textContent = section.section;
    document.querySelector('#section-title').textContent = section.subject;
    document.querySelector('#summary-course').textContent = section.subject;
    document.querySelector('#summary-section').textContent = section.section;
    document.querySelector('#summary-title').textContent = section.subject;
    document.querySelector('#summary-schedule').textContent = section.schedule || 'Not set';
    document.querySelector('#summary-room').textContent = section.room || 'Not set';
    document.querySelector('#summary-code').textContent = section.joinCode;
    document.querySelector('#student-attendance-count').textContent =
      `${(section.students || []).length} students`;

    attendanceButton.addEventListener('click', () => {
      openCheckinDialog();
    });

    document.querySelector('#delete-section').addEventListener('click', () => {
      if (!window.confirm(`Delete ${section.subject} · ${section.section}? This cannot be undone.`)) return;
      saveTeacherSections(sections.filter(item => item.id !== sectionId));
      window.location.href = 'teacherdb.html';
    });
    searchInput.addEventListener('input', renderAttendance);
    statusFilter.addEventListener('change', renderAttendance);
    renderJoinRequests();
    renderAttendance();
  }

  // --- Teacher Dashboard Population (teacherdb.html) ---
  // --- Teacher Dashboard & Create Section (teacherdb.html / createsec.html) ---
  // --- Student Monthly Attendance Modal (studentatt.html) ---
  const studentAttModal = document.querySelector('#student-att-modal');
  if (studentAttModal) {
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));
    if (!currentUser || currentUser.role !== 'teacher') {
      window.location.href = getLoginPath();
      return;
    }

    document.querySelector('#nav-user-name').textContent =
      `${currentUser.firstName} ${currentUser.lastName}`;
    document.querySelector('#user-avatar').textContent =
      `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    document.querySelector('#btn-signout').addEventListener('click', () => {
      localStorage.removeItem('attendify_current_user');
      window.location.href = getLoginPath();
    });

    const params = new URLSearchParams(window.location.search);
    const studentEmail = params.get('email');
    const sectionId = params.get('section');
    const student = getUsers().find(user =>
      user.role === 'student' && user.email === studentEmail
    );
    const studentName = student
      ? `${student.firstName} ${student.lastName}`
      : params.get('name') || 'Student';
    const studentId = student && student.studentId
      ? student.studentId
      : params.get('id') || studentEmail || 'Student ID unavailable';
    const initials = params.get('initials') ||
      studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const section = getStoredTeacherSections().find(item =>
      item.id === sectionId &&
      (!item.teacherEmail || item.teacherEmail === currentUser.email)
    );
    const studentIsEnrolled = Boolean(
      section && studentEmail && (section.students || []).includes(studentEmail)
    );
    const monthParam = params.get('month');
    const monthMatch = monthParam && monthParam.match(/^(\d{4})-(\d{2})$/);
    const currentMonth = getPhilippineDateKey().slice(0, 7).split('-').map(Number);
    const year = monthMatch ? Number(monthMatch[1]) : currentMonth[0];
    const monthIndex = monthMatch ? Number(monthMatch[2]) - 1 : currentMonth[1] - 1;
    const validMonth = monthIndex >= 0 && monthIndex < 12;
    const displayYear = validMonth ? year : currentMonth[0];
    const displayMonthIndex = validMonth ? monthIndex : currentMonth[1] - 1;
    const currentMonthDate = new Date(currentMonth[0], currentMonth[1] - 1, 1);
    const displayMonth = new Date(displayYear, displayMonthIndex, 1);

    document.querySelector('#modal-student-name').textContent = studentName;
    document.querySelector('#modal-student-id').textContent = studentId;
    document.querySelector('#modal-student-initials').textContent = initials;
    document.querySelector('#calendar-section-context').textContent = section
      ? `${section.courseCode} · ${section.section} — ${section.subject}`
      : 'Section information unavailable';
    if (section) {
      document.querySelector('#bg-section-code').textContent =
        `${section.courseCode} · ${section.section}`;
      document.querySelector('#bg-subject-title').textContent = section.subject;
      document.querySelector('#bg-banner-subject').textContent = section.subject;
      document.querySelector('#bg-students-count').textContent =
        (section.students || []).length;
      document.querySelector('#bg-join-code').textContent = section.joinCode || '—';
    }
    const daysGrid = document.querySelector('#calendar-days-grid');
    const monthTitle = document.querySelector('#calendar-month-title');
    const previousMonthButton = document.querySelector('#teacher-calendar-previous');
    const nextMonthButton = document.querySelector('#teacher-calendar-next');
    if (daysGrid) {
      const renderCalendar = () => {
        const displayYear = displayMonth.getFullYear();
        const displayMonthIndex = displayMonth.getMonth();
        const monthKey = `${displayYear}-${String(displayMonthIndex + 1).padStart(2, '0')}`;
        const attendanceByDate = {};
        const attendanceTimeByDate = {};
        if (studentIsEnrolled) {
          (section.attendanceSessions || []).forEach(session => {
            if (!session.date || !session.date.startsWith(`${monthKey}-`)) return;
            const status = session.statuses && session.statuses[studentEmail];
            if (['present', 'late', 'absent'].includes(status)) {
              attendanceByDate[session.date] = status;
              attendanceTimeByDate[session.date] =
                session.statusTimes && session.statusTimes[studentEmail];
            } else {
              delete attendanceByDate[session.date];
              delete attendanceTimeByDate[session.date];
            }
          });
        }

        const firstWeekday = new Date(displayYear, displayMonthIndex, 1).getDay();
        const daysInMonth = new Date(displayYear, displayMonthIndex + 1, 0).getDate();
        const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
        const statusCounts = { present: 0, late: 0, absent: 0 };
        let cellsHTML = '<div class="cal-cell"></div>'.repeat(firstWeekday);

        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
          const status = attendanceByDate[dateKey];
          const timestamp = attendanceTimeByDate[dateKey];
          if (status) statusCounts[status] += 1;
          const recordedAt = timestamp ? `, ${formatPhilippineDateTime(timestamp)}` : '';
          cellsHTML += `
            <div class="cal-cell${status ? ` status-${status}` : ''}"
              aria-label="${dateKey}${status ? `, ${status}` : ', no attendance record'}${recordedAt}"
              title="${dateKey}${status ? `, ${status}` : ', no attendance record'}${recordedAt}">
              <span class="cal-day-num">${day}</span>
              ${status ? `<span class="cal-status-text">${status.toUpperCase()}</span>` : ''}
              ${timestamp ? `<span class="cal-status-time">${formatPhilippineTime(timestamp)}</span>` : ''}
            </div>
          `;
        }
        cellsHTML += '<div class="cal-cell"></div>'.repeat(totalCells - firstWeekday - daysInMonth);

        daysGrid.innerHTML = cellsHTML;
        monthTitle.textContent = new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric'
        }).format(displayMonth);
        document.querySelector('#summary-present-count').textContent = statusCounts.present;
        document.querySelector('#summary-late-count').textContent = statusCounts.late;
        document.querySelector('#summary-absent-count').textContent = statusCounts.absent;
        nextMonthButton.disabled = displayMonth >= currentMonthDate;
      };

      previousMonthButton.addEventListener('click', () => {
        displayMonth.setMonth(displayMonth.getMonth() - 1);
        renderCalendar();
      });
      nextMonthButton.addEventListener('click', () => {
        if (displayMonth >= currentMonthDate) return;
        displayMonth.setMonth(displayMonth.getMonth() + 1);
        renderCalendar();
      });
      renderCalendar();
    }
  }
  const teacherDashboardBody = document.querySelector('.teacher-dashboard-body');
  if (teacherDashboardBody && !studentAttModal) {
    const currentUser = JSON.parse(localStorage.getItem('attendify_current_user'));

    if (!currentUser || currentUser.role !== 'teacher') {
      window.location.href = getLoginPath();
      return;
    }

    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();

    document.querySelector('#dash-first-name').textContent = currentUser.firstName;
    document.querySelector('#nav-user-name').textContent = fullName;
    document.querySelector('#user-avatar').textContent = initials;

    const showTeacherDialog = ({ title, message, confirmText, cancelText, destructive, hideCancel, onConfirm }) => {
      const overlay = document.createElement('div');
      overlay.className = 'teacher-dialog-overlay';
      overlay.setAttribute('role', destructive ? 'alertdialog' : 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      const dialog = document.createElement('div');
      dialog.className = 'teacher-dialog';
      const icon = document.createElement('div');
      icon.className = `teacher-dialog-icon${destructive ? ' is-destructive' : ''}`;
      icon.innerHTML = destructive
        ? '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-check" aria-hidden="true"></i>';

      const heading = document.createElement('h2');
      heading.className = 'teacher-dialog-title';
      heading.textContent = title;
      const description = document.createElement('p');
      description.className = 'teacher-dialog-message';
      description.textContent = message;

      const actions = document.createElement('div');
      actions.className = 'teacher-dialog-actions';
      let cancelButton;
      if (!hideCancel) {
        cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'teacher-dialog-cancel';
        cancelButton.textContent = cancelText || 'Close';
        cancelButton.addEventListener('click', () => overlay.remove());
        actions.appendChild(cancelButton);
      }

      if (confirmText) {
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = `teacher-dialog-confirm${destructive ? ' is-destructive' : ''}`;
        confirmButton.textContent = confirmText;
        confirmButton.addEventListener('click', () => {
          overlay.remove();
          onConfirm();
        });
        actions.appendChild(confirmButton);
      }

      dialog.append(icon, heading, description, actions);
      overlay.appendChild(dialog);
      overlay.addEventListener('click', event => {
        if (event.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
      (cancelButton || overlay.querySelector('.teacher-dialog-confirm')).focus();
    };

    const demoSectionIds = new Set(['sec-1', 'sec-2', 'sec-3', 'sec-4']);
    const storedSections = getStoredTeacherSections();
    const sectionsWithoutDemoData = storedSections.filter(section =>
      section.teacherEmail || !demoSectionIds.has(section.id)
    );
    if (sectionsWithoutDemoData.length !== storedSections.length) {
      saveTeacherSections(sectionsWithoutDemoData);
    }

    const getTeacherSections = () => getStoredTeacherSections().filter(section =>
      section.teacherEmail === currentUser.email
    );

    const renderSections = () => {
      const sectionsGrid = document.querySelector('#sections-grid');
      const activeCountEl = document.querySelector('#active-classes-count');
      if (!sectionsGrid) return;

      const sections = getTeacherSections();
      if (activeCountEl) activeCountEl.textContent = sections.length;

      sectionsGrid.innerHTML = sections.length
        ? sections.map(sec => `
        <div class="folder-card" data-id="${sec.id}" role="link" tabindex="0"
          aria-label="Open ${sec.courseCode} ${sec.section}: ${sec.subject}"
          data-href="sections.html?id=${encodeURIComponent(sec.id)}">
          <div class="folder-tab"></div>
          <div class="folder-body">
            <div class="folder-top">
              <div class="folder-icon ${sec.iconColor || 'green'}">
                <i class="fa-regular fa-folder"></i>
              </div>
              <div class="folder-actions">
                <span class="course-pill">${sec.courseCode}</span>
                <button class="btn-delete-section" data-id="${sec.id}" title="Delete section">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>

            <p class="section-label">${sec.section.toUpperCase()}</p>
            <h4 class="course-title">${sec.subject}</h4>
            <p class="course-schedule">${sec.schedule}</p>

            <div class="folder-footer" style="display: flex; justify-content: space-between;">
              <span>${(sec.students || []).length || sec.studentsCount || 0} students</span>
              <span style="font-weight: 600; color: #1b5344;">Code: ${sec.joinCode}</span>
            </div>
            <a class="section-details-link" href="sections.html?id=${encodeURIComponent(sec.id)}">
              View students and attendance <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      `).join('')
        : `
          <div class="teacher-empty-state" role="status">
            <div class="teacher-empty-icon"><i class="fa-regular fa-folder-open" aria-hidden="true"></i></div>
            <h4>No sections yet</h4>
            <p>Create a section to organize your classes and invite students to join.</p>
            <a href="createsec.html" class="teacher-empty-action">
              <i class="fa-solid fa-plus" aria-hidden="true"></i> Create your first section
            </a>
          </div>
        `;

      sectionsGrid.querySelectorAll('.folder-card[data-href]').forEach(card => {
        const openSection = event => {
          if (event.target.closest('a, button')) return;
          window.location.href = card.dataset.href;
        };
        card.addEventListener('click', openSection);
        card.addEventListener('keydown', event => {
          if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          window.location.href = card.dataset.href;
        });
      });

      // Attach delete events
      document.querySelectorAll('.btn-delete-section').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const secId = btn.getAttribute('data-id');
          const section = getTeacherSections().find(item => item.id === secId);
          if (!section) return;
          showTeacherDialog({
            title: 'Delete this section?',
            message: `${section.subject} · ${section.section} will be permanently removed. Students will no longer be able to join it with its class code.`,
            confirmText: 'Delete section',
            cancelText: 'Keep section',
            destructive: true,
            onConfirm: () => {
            const updated = getStoredTeacherSections().filter(s => s.id !== secId);
            saveTeacherSections(updated);
            renderSections();
            }
          });
        });
      });
    };

    renderSections();

    // Handle Create Section Form Submit (createsec.html)
    const createSectionForm = document.querySelector('#create-section-form');
    if (createSectionForm) {
      createSectionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const subject = document.querySelector('#subject-name').value.trim();
        const section = document.querySelector('#section-name').value.trim();
        const courseCode = document.querySelector('#course-code').value.trim().toUpperCase();
        const schedule = document.querySelector('#schedule').value.trim();
        const room = document.querySelector('#room').value.trim();

        // Generate random 4-char suffix for unique join code (e.g. HCI-A4K9)
        const prefix = courseCode.replace(/[^A-Z]/g, '').slice(0, 3) || 'CLS';
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const joinCode = `${prefix}-${randomCode}`;

        const colors = ['green', 'olive', 'slate'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newSection = {
          id: 'sec-' + Date.now(),
          section,
          subject,
          courseCode,
          schedule,
          room,
          studentsCount: 0,
          teacherEmail: currentUser.email,
          students: [],
          attendanceSessions: [],
          joinCode,
          iconColor: randomColor
        };

        const sections = getStoredTeacherSections();
        sections.push(newSection);
        saveTeacherSections(sections);

        showTeacherDialog({
          title: 'Section created',
          message: `Your section is ready. Share this join code with your students: ${joinCode}`,
          confirmText: 'Go to dashboard',
          hideCancel: true,
          onConfirm: () => {
            window.location.href = 'teacherdb.html';
          }
        });
      });
    }

    // Sign out handler
    const btnSignout = document.querySelector('#btn-signout');
    if (btnSignout) {
      btnSignout.addEventListener('click', () => {
        localStorage.removeItem('attendify_current_user');
        window.location.href = getLoginPath();
      });
    }
  }

});