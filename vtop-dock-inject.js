(function() {
  "use strict";
  // --- CSS ---
  const style = document.createElement('style');
  style.innerHTML = `
    #sidePanel, .btnBarColor, .navbar-toggler, .navbar-toggler-icon, [data-bs-toggle="offcanvas"] {
      display: none !important;
    }
    #vtop-dock {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      background: rgba(255,255,255,0.85);
      border-radius: 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      padding: 10px 18px;
      gap: 14px;
      min-height: 56px;
      transition: opacity 0.18s cubic-bezier(.4,0,.2,1), bottom 0.18s cubic-bezier(.4,0,.2,1);
      opacity: 0;
      pointer-events: none;
    }
    #vtop-dock.vtop-dock-visible {
      opacity: 1;
      pointer-events: auto;
      bottom: 32px;
    }
    .vtop-dock-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1);
      position: relative;
    }
    .vtop-dock-icon:hover {
      transform: scale(1.18);
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      background: rgba(0,0,0,0.04);
    }
    .vtop-dock-dropdown {
      display: none;
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translateX(-50%) scale(0.98);
      min-width: 240px;
      max-height: 340px;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 10px 0;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.13s cubic-bezier(.4,0,.2,1), transform 0.13s cubic-bezier(.4,0,.2,1);
      scrollbar-width: thin;
    }
    .vtop-dock-dropdown.open {
      display: block;
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) scale(1);
    }
    .vtop-dock-dropdown .dock-section-title {
      font-weight: bold;
      font-size: 1rem;
      padding: 6px 18px 4px 18px;
      color: #1a237e;
    }
    .vtop-dock-dropdown .dock-link, .vtop-dock-dropdown .dock-subsection {
      display: block;
      padding: 7px 22px;
      color: #222;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.98rem;
      cursor: pointer;
      transition: background 0.13s cubic-bezier(.4,0,.2,1);
      white-space: nowrap;
    }
    .vtop-dock-dropdown .dock-link:hover, .vtop-dock-dropdown .dock-subsection:hover {
      background: #e3e8fd;
      color: #1a237e;
    }
    .vtop-dock-dropdown .dock-subsection {
      font-weight: 500;
      margin-top: 4px;
      margin-bottom: 2px;
      background: #f5f7fa;
      color: #3949ab;
    }
    .vtop-dock-dropdown .dock-nested {
      margin-left: 12px;
      border-left: 2px solid #e3e8fd;
      padding-left: 8px;
    }
    #vtop-dock::-webkit-scrollbar, .vtop-dock-dropdown::-webkit-scrollbar {
      width: 6px;
      background: #e3e8fd;
    }
    #vtop-dock::-webkit-scrollbar-thumb, .vtop-dock-dropdown::-webkit-scrollbar-thumb {
      background: #b3baf7;
      border-radius: 8px;
    }
    #vtop-dock-hover-area {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 40px;
      z-index: 9998;
      pointer-events: auto;
    }
  `;
  document.head.appendChild(style);

  let hoverArea = document.getElementById('vtop-dock-hover-area');
  if (!hoverArea) {
    hoverArea = document.createElement('div');
    hoverArea.id = 'vtop-dock-hover-area';
    document.body.appendChild(hoverArea);
  }

  // --- Full sidebar menu structure (all 19 sections, all subsections, based on your HTML) ---
  const dockMenus = [
    { icon: 'fa-phone-square', label: 'Contact Us', url: 'hrms/contactDetails', ajax: 'B5' },
    { icon: 'fa-envelope', label: 'Generic Feedback', children: [
      { label: 'Feedback Form', url: 'others/genericfeedback/initViewGenericFeedback', ajax: 'B5' },
    ] },
    { icon: 'fa-briefcase', label: 'My Info', children: [
      { label: 'Profile', url: 'studentsRecord/StudentProfileAllView', ajax: 'B5' },
      { label: 'Credentials', url: 'proctor/viewStudentCredentials', ajax: 'Main' },
      { label: 'Dayboarder Info', url: 'admissions/dayboarderForMenu', ajax: 'B5' },
      { label: 'Acknowledgement View', url: 'admissions/AcknowledgmentView', ajax: 'Main' },
      { label: 'Student Bank Info', url: 'studentBankInformation/BankInfoStudent', ajax: 'Main' },
      { label: 'My Scholarships', url: 'admissions/getStudentScholarshipDetails', ajax: 'B5' },
    ] },
    { icon: 'fa-info-circle', label: 'Info Corner', children: [
      { label: 'Health Center Feedback', url: 'get/healthcenter/feedback/questions', ajax: 'B5' },
      { label: 'FAQ', url: 'academics/common/FaqPreview', ajax: 'Main' },
      { label: 'General', url: 'admissions/costCentreCircularsViewPageController', ajax: 'Main' },
    ] },
    { icon: 'fa-paw', label: 'Proctor', children: [
      { label: 'Proctor Details', url: 'proctor/viewProctorDetails', ajax: 'Main' },
      { label: 'Proctor Message', url: 'proctor/viewMessagesSendByProctor', ajax: 'Main' },
    ] },
    { icon: 'fa-book', label: 'Course Enrollment', children: [
      { label: 'EXC Registration', url: 'academics/exc/studentRegistration', ajax: 'B5' },
      { label: 'MOOC Registration', url: 'academics/mooc/studentRegistration', ajax: 'B5' },
      { label: 'WishList', url: 'academics/registration/wishlistRegPage', ajax: 'Main' },
      { label: 'Course Withdraw', url: 'academics/withdraw/courseWithdraw', ajax: 'B5' },
    ] },
    { icon: 'fa-graduation-cap', label: 'Academics', children: [
      { label: 'HOD and Dean Info', url: 'hrms/viewHodDeanDetails', ajax: 'B5' },
      { label: 'Faculty Info', url: 'hrms/employeeSearchForStudent', ajax: 'B5' },
      { label: 'Course Feedback 24x7', url: 'academics/common/StudentClassGrievance', ajax: 'Main' },
      { label: 'Biometric Info', url: 'academics/common/BiometricInfo', ajax: 'Main' },
      { label: 'Class Messages', url: 'academics/common/StudentClassMessage', ajax: 'Main' },
      { label: 'Regulation', url: 'academics/council/CouncilRegulationView/new', ajax: 'Main' },
      { label: 'My Curriculum', url: 'academics/common/Curriculum', ajax: 'B5' },
      { label: 'Minor/ Honour', url: 'academics/additionalLearning/AdditionalLearningStudentView', ajax: 'B5' },
      { label: 'Time Table', url: 'academics/common/StudentTimeTable', ajax: 'B5' },
      { label: 'Class Attendance', url: 'academics/common/StudentAttendance', ajax: 'B5' },
      { label: 'Course Page', url: 'academics/common/StudentCoursePage', ajax: 'B5' },
      { label: 'Industrial Internship', url: 'internship/InternshipRegistration', ajax: 'B5' },
      { label: 'Project', url: 'academics/common/ProjectView', ajax: 'Main' },
      { label: 'Digital Assignment Upload', url: 'examinations/StudentDA', ajax: 'B5' },
      { label: 'QCM View', url: 'academics/common/QCMStudentLogin', ajax: 'Main' },
      { label: 'SET Conference Registration', url: 'set/setRegistrationViewPage', ajax: 'B5' },
      { label: 'Outcome SET Conference', url: 'outcome/set/studentRegistrationPage', ajax: 'B5' },
      { label: 'Co-Extra Curricular', url: 'academics/common/ExtraCurricular', ajax: 'Main' },
      { label: 'Academics Calendar', url: 'academics/common/CalendarPreview', ajax: 'Main' },
      { label: 'Course Registration Allocation', url: 'academics/common/StudentRegistrationScheduleAllocation', ajax: 'Main' },
      { label: 'Registration Schedule', url: 'academics/common/studentAllocationView', ajax: 'Main' },
      { label: 'Project Course', url: 'academics/student/PJTReg/loadRegistrationPage', ajax: 'B5' },
      { label: 'Apaar ID Upload', url: 'apaarid/upload', ajax: 'B5' },
    ] },
    { icon: 'fa-bank', label: 'Research', children: [
      { label: 'My Research Profile', url: 'research/researchProfile', ajax: 'B5' },
      { label: 'Course Work Registration', url: 'research/CourseworkRegistration', ajax: 'B5' },
      { label: 'Registration Status', url: 'research/CourseworkRegistrationViewtoScholar', ajax: 'B5' },
      { label: 'Meeting info', url: 'research/scholarsMeetingView', ajax: 'B5' },
      { label: 'Attendance view', url: 'research/scholarsAttendanceView', ajax: 'B5' },
      { label: 'Research Letters', url: 'research/researchLettersStudentView', ajax: 'B5' },
      { label: 'Electronic Thesis Submission', url: 'research/thesisSubmission', ajax: 'B5' },
      { label: 'Research Document Upload', url: 'research/researchDocumentUpload', ajax: 'B5' },
      { label: 'Guide Scholar Meeting', url: 'research/guideScholarMeetingView', ajax: 'B5' },
      { label: 'Weekly Scholar WorkLoad', url: 'research/scholarWorkloadEntryPage', ajax: 'B5' },
    ] },
    { icon: 'fa-book', label: 'Examination', children: [
      { label: 'Exam Schedule', url: 'examinations/StudExamSchedule', ajax: 'B5' },
      { label: 'Marks', url: 'examinations/StudentMarkView', ajax: 'B5' },
      { label: 'Grades', url: 'examinations/examGradeView/StudentGradeView', ajax: 'Main' },
      { label: 'Paper See/Rev', url: 'examinations/paperSeeing/PaperSeeing', ajax: 'B5' },
      { label: 'Grade History', url: 'examinations/examGradeView/StudentGradeHistory', ajax: 'Main' },
      { label: 'Additional Learning', url: 'examinations/doGetAddLearnCourseDashboard', ajax: 'B5' },
      { label: 'Project File Upload', url: 'examinations/projectFileUpload/ProjectView', ajax: 'B5' },
      { label: 'MOOC File upload', url: 'examinations/gotToMoocCourseInitial', ajax: 'Main' },
      { label: 'ECA File Upload', url: 'examinations/ecaUpload/viewCourse', ajax: 'B5' },
      { label: 'EPT schedule', url: 'compre/eptScheduleShow', ajax: 'Main' },
      { label: 'Online Examinations', children: [
        { label: 'Comprehensive Exam', url: 'compre/registrationForm', ajax: 'Main' },
        { label: 'Exam Information', url: 'compre/studentExamInfo', ajax: 'Main' },
      ] },
      { label: 'Arrear/ReFAT Details', children: [
        { label: 'Regular Arrear/ReFAT', children: [
          { label: 'Registration', url: 'examinations/arrearRegistration/RegularArrearStudentReg', ajax: 'Main' },
          { label: 'Registration Details', url: 'examinations/arrearRegistration/LoadRegularArrearViewPage', ajax: 'B5' },
          { label: 'Exam Schedule', url: 'examinations/arrearRegistration/viewRARExamSchedule', ajax: 'B5' },
          { label: 'Grade View', url: 'examinations/arrearRegistration/StudentArrearGradeView', ajax: 'B5' },
          { label: 'Paper See/Rev', url: 'examinations/regularArrear/RegularArrearPaperSeeing', ajax: 'B5' },
        ] },
        { label: 'Re-Exam Application', url: 'examinations/reFAT/StudentReFATRequestPageController', ajax: 'Main' },
        { label: 'Code of Conduct', url: 'examinations/malpracticePunishmentDetails', ajax: 'B5' },
      ] },
    ] },
    { icon: 'fa-bank', label: 'Library', children: [
      { label: 'Online Book Recommendation', url: 'hrms/onlineBookRecommendation', ajax: 'B5' },
    ] },
    { icon: 'fa-space-shuttle', label: 'Services', children: [
      { label: 'Facility Registration', url: 'phyedu/facilityAvailable', ajax: 'B5' },
      { label: 'Transport Registration', url: 'transport/transportRegistration', ajax: 'B5' },
      { label: 'PAT Registration', url: 'pat/PatRegistrationProcess', ajax: 'B5' },
      { label: 'Transcript Request', url: 'alumni/alumniTranscriptPageControl', ajax: 'Main' },
      { label: 'Financial Assistance Scholarship', url: 'admissions/scholarshipPageController', ajax: 'Main' },
      { label: 'Achievements', url: 'admissions/SpecialAchieversAwards', ajax: 'Main' },
      { label: 'Programme Migration', url: 'admissions/programmeMigration', ajax: 'Main' },
      { label: 'Graduated information', url: 'admissions/doGetPassedOutInformation', ajax: 'Main' },
      { label: 'Late Hour Request', url: 'hostels/late/hour/student/request/1', ajax: 'B5' },
      { label: 'Final Year Registration', url: 'vitaa/finalyearcheck', ajax: 'Main' },
      { label: 'SAP Application', children: [
        { label: 'SAP Project', url: 'sap/SapManage', ajax: 'B5' },
        { label: 'Apply Credit Transfer', url: 'sap/SapCreditManage', ajax: 'B5' },
      ] },
      { label: 'Certificate Upload', url: 'admissions/reserachFresherCertUpload', ajax: 'Main' },
      { label: 'eSanad Request', url: 'others/esanad/doApply', ajax: 'B5' },
    ] },
    { icon: 'fa-certificate', label: 'Bonafide', children: [
      { label: 'Apply Bonafide', url: 'others/bonafide/StudentBonafidePageControl', ajax: 'Main' },
    ] },
    { icon: 'fa-money', label: 'Online Payments', children: [
      { label: 'Payments', url: 'finance/Payments', ajax: 'B5' },
      { label: 'Wallet Amount Add', url: 'finance/getStudentWalletUpload', ajax: 'B5' },
      { label: 'Payment Receipts', url: 'finance/getStudentReceipts', ajax: 'B5' },
      { label: 'Fees Intimation', url: 'finance/getStudentFeesIntimation', ajax: 'B5' },
      { label: 'Online Transfer', url: 'finance/getOnlineTransfer', ajax: 'Main' },
      { label: 'Library Due', url: 'finance/libraryPayments', ajax: 'B5' },
    ] },
    { icon: 'fa-home', label: 'Hostels', children: [
      { label: 'Online Booking - Summer', url: 'hostels/online/room/allotment/open', ajax: 'B5' },
      { label: 'Leave Request', url: 'hostels/student/leave/1', ajax: 'B5' },
      { label: 'Hostel Vacating', url: 'hostels/vacating', ajax: 'B5' },
      { label: 'Mess Selection 2025-2026', url: 'hostels/counselling/mess/registration', ajax: 'B5' },
      { label: 'Mess Change', url: 'hostels/onlineMessChange', ajax: 'B5' },
      { label: 'Summer Room-Details', url: 'hostels/summerRoomDetails', ajax: 'B5' },
      { label: 'Counselling 2025', children: [
        { label: 'Know Your Rank', url: 'hostels/counsellingSlotTimings', ajax: 'B5' },
        { label: 'Provisional Allotment Letter', url: 'hostels/counselling/provisional/order/1', ajax: 'B5' },
      ] },
    ] },
    { icon: 'fa-book', label: 'TLCE FDP', children: [
      { label: 'FDP Registration', url: 'events/ASC/EventsRegistration', ajax: 'B5' },
      { label: 'Participant Certificate', url: 'events/ASC/EventsCertificateDownload', ajax: 'B5' },
      { label: 'FDP Quiz', url: 'events/TLCE/quiz/loadQuizExamPage', ajax: 'B5' },
      { label: 'Biometric Log', url: 'events/tlce/participant/doLoadBiometricLog', ajax: 'B5' },
    ] },
    { icon: 'fa-shield', label: 'Events', children: [
      { label: 'SixSigma Certificate', url: 'events/sixsigma/loadStudentViewPage', ajax: 'B5' },
      { label: 'Certificate Download', url: 'events/swf/certificateDownload', ajax: 'B5' },
      { label: 'University Day', children: [
        { label: 'eCertificates', url: 'event/uday/certificates', ajax: 'B5' },
      ] },
      { label: 'Convocation', children: [
        { label: 'Registration', url: 'convocation/entryPage', ajax: 'Main' },
      ] },
    ] },
    { icon: 'fa-trophy', label: 'SW Events', children: [
      { label: 'Club/Chapter Enrollment', url: 'event/swf/student/loadClubChapterEnrollmentPage', ajax: 'B5' },
      { label: 'Event Requisition', url: 'event/swf/loadRequisitionPage', ajax: 'B5' },
      { label: 'Event Attendance', url: 'event/swf/loadEventAttendance', ajax: 'B5' },
      { label: 'Event Registration', url: 'event/swf/loadEventRegistration', ajax: 'B5' },
    ] },
    { icon: 'fa-star', label: 'International Relations (IR)', children: [
      { label: 'Student Inbound Request', url: 'ir/student/inboundVisitingRequest', ajax: 'B5' },
      { label: 'Student Outbound Request', url: 'ir/student/visitingRequest', ajax: 'B5' },
    ] },
    { icon: 'fa-lock', label: 'My Account', children: [
      { label: 'Backup Codes', url: 'backupCode/getBackupcodes', ajax: 'B5' },
      { label: 'Change Password', url: 'controlpanel/ChangePassword', ajax: 'B5' },
      { label: 'Update LoginID', url: 'controlpanel/ChangePreferredUser', ajax: 'Main' },
    ] },
  ];

  function buildDataText() {
    const id = document.getElementById('authorizedIDX')?.value || '';
    let csrfValue = '';
    if (typeof window.csrfValue !== 'undefined') {
      csrfValue = window.csrfValue;
    } else {
      const csrfInput = document.querySelector('input[name="_csrf"]');
      if (csrfInput) csrfValue = csrfInput.value;
    }
    return `verifyMenu=true&authorizedID=${encodeURIComponent(id)}&_csrf=${encodeURIComponent(csrfValue)}&nocache=${Date.now()}`;
  }

  function safeAjaxCall(item, dataText) {
    const fn = item.ajax === 'B5' ? window.ajaxB5Call : window.ajaxCall;
    if (typeof fn === 'function') {
      fn(item.url, dataText);
    } else {
      console.warn(`[VTOP Dock] ${item.ajax === 'B5' ? 'ajaxB5Call' : 'ajaxCall'} not found!`);
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.vtop-dock-dropdown.open').forEach(dd => dd.classList.remove('open'));
  }

  function renderDropdown(menu, parent) {
    menu.forEach(item => {
      if (item.children) {
        const section = document.createElement('div');
        section.className = 'dock-subsection';
        section.textContent = item.label;
        parent.appendChild(section);
        const nested = document.createElement('div');
        nested.className = 'dock-nested';
        renderDropdown(item.children, nested);
        parent.appendChild(nested);
      } else {
        const link = document.createElement('a');
        link.className = 'dock-link';
        link.textContent = item.label;
        link.href = 'javascript:void(0)';
        link.onclick = (e) => {
          e.preventDefault();
          safeAjaxCall(item, buildDataText());
          closeAllDropdowns();
        };
        parent.appendChild(link);
      }
    });
  }

  function initDock() {
    if (!document.getElementById('vtop-dock')) {
      const dock = document.createElement('div');
      dock.id = 'vtop-dock';
      dock.style.userSelect = 'none';
      dock.style.webkitUserSelect = 'none';
      document.body.appendChild(dock);

      let openDropdown = null;
      let openTimeout = null;
      let closeTimeout = null;

      dockMenus.forEach((menu) => {
        const iconBtn = document.createElement('div');
        iconBtn.className = 'vtop-dock-icon';
        iconBtn.innerHTML = `<i class="fa ${menu.icon}"></i>`;
        iconBtn.title = menu.label;
        dock.appendChild(iconBtn);

        const dropdown = document.createElement('div');
        dropdown.className = 'vtop-dock-dropdown';
        if (menu.children) {
          const title = document.createElement('div');
          title.className = 'dock-section-title';
          title.textContent = menu.label;
          dropdown.appendChild(title);
          renderDropdown(menu.children, dropdown);
        } else {
          const link = document.createElement('a');
          link.className = 'dock-link';
          link.textContent = menu.label;
          link.href = 'javascript:void(0)';
          link.onclick = (e) => {
            e.preventDefault();
            safeAjaxCall(menu, buildDataText());
            closeAllDropdowns();
          };
          dropdown.appendChild(link);
        }
        iconBtn.appendChild(dropdown);

        iconBtn.addEventListener('mouseenter', () => {
          if (closeTimeout) clearTimeout(closeTimeout);
          if (openDropdown && openDropdown !== dropdown) openDropdown.classList.remove('open');
          openTimeout = setTimeout(() => {
            dropdown.classList.add('open');
            openDropdown = dropdown;
          }, 30);
        });
        iconBtn.addEventListener('mouseleave', () => {
          if (openTimeout) clearTimeout(openTimeout);
          closeTimeout = setTimeout(() => {
            dropdown.classList.remove('open');
            openDropdown = null;
          }, 120);
        });
        dropdown.addEventListener('mouseenter', () => {
          if (closeTimeout) clearTimeout(closeTimeout);
        });
        dropdown.addEventListener('mouseleave', () => {
          closeTimeout = setTimeout(() => {
            dropdown.classList.remove('open');
            openDropdown = null;
          }, 120);
        });
      });

      let dockVisible = false;
      function showDock() {
        if (!dockVisible) {
          dock.classList.add('vtop-dock-visible');
          dockVisible = true;
        }
      }
      function hideDock() {
        if (dockVisible) {
          dock.classList.remove('vtop-dock-visible');
          dockVisible = false;
        }
      }
      hoverArea.addEventListener('mouseenter', showDock);
      dock.addEventListener('mouseenter', showDock);
      dock.addEventListener('mouseleave', hideDock);
      hoverArea.addEventListener('mouseleave', hideDock);
      showDock();
      setTimeout(hideDock, 1800);
    }
  }

  function waitForVtopAjax() {
    if (typeof window.ajaxCall === 'function' && typeof window.ajaxB5Call === 'function') {
      initDock();
    } else {
      setTimeout(waitForVtopAjax, 100);
    }
  }
  waitForVtopAjax();
})(); 