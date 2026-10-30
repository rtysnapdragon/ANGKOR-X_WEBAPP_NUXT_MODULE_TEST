
export default {
  userCatch: "user_catch",
  deviceId: "device_id",
  dbCode: "rty_database",
  langCode: "i18n_redirected",
  fbMessagingToken: "fb_messaging_token",
  GlobalKey: '_',


  system:{
    address:{
      refType:{
        country: "COUNTRYS",
        province: "PROVINCES",
        district: "DISTRICTS",
        commune: "COMMUNES",
        village: "VILLAGES",
      }
    }
  },
  
  humanResource: {
    employee: {
      workingStatus: [
        { en: "Working", km: "ធ្វើការ", text: "Working", value: "Working" },
        { en: "Resigned", km: "សុំឈប់ពីការងារ", text: "Resigned", value: "Resigned" },
        { en: "Terminated", km: "បញ្ឈប់ពីការងារ", text: "Terminated", value: "Terminated" },
        { en: "Expired", km: "ហួសសុពលភាពការងារ", text: "Expired", value: "Expired" },
        { en: "Abandoned", km: "បោះបង់ការងារ", text: "Abandoned", value: "Abandoned" },
      ],
      maritalStatus: [
        { en: "Married", km: "រៀបការ", text: "Married", value: "Married" },
        { en: "Divorce", km: "លែងលះ", text: "Divorce", value: "Divorce" },
        { en: "Widow", km: "មេម៉ាយ", text: "Widow", value: "Widow" },
        { en: "Single", km: "នៅលីវ", text: "Single", value: "Single" },
      ],
      NSSFType: [
        { en: "InSystem", km: "ក្នុងប្រព័ន្ធ", text: "InSystem", value: "InSystem" },
        { en: "OutSystem", km: "ក្រៅប្រព័ន្ធ", text: "OutSystem", value: "OutSystem" },
      ],
      paidStatus:[
        { en: 'Paid', km: 'បានបង់ប្រាក់', text: 'Paid', value: "Paid" },
        { en: 'Holding', km: 'Holding', text: 'Holding', value: "Holding" },
        { en: 'Calculating', km: 'Calculating', text: 'Calculating', value: "Calculating" },
      ],
      strGeneral: "general",
      strWorkInformation: "working_info",
    },
    leave:{
      leaveStatus: [
        { en: 'Reject', km: 'បដិសេធ', text: 'Reject', value: 0 },
        { en: 'Approve', km: 'អនុម័ត', text: 'Approve', value: 1 },
        { en: 'Pending', km: 'កំពុងរងចាំ', text: 'Pending', value: 2 },
        { en: 'Ask for Help', km: 'ស្នើរសុំជំនួយ', text: 'AskHelp', value: 3 },
        { en: 'Review', km: 'ពិនិត្យឡើងវិញ', text: 'Review', value: 4 },
        { en: 'Request', km: 'ស្នើសុំ', text: 'Request', value: 5 },
      ]
    }
  },

  employeeAttendance: {
    dayType : {
      publicHoliday: { label: "Public Holiday", value: 'P' },
      dayOff: { label: "Day Off", value: 'O' },
      normal: { label: "Normal", value: 'N' },
    },

    monthlyAttendance: {
      timeOption: {
        A: "A",
        J: "J",
      },
    },
    
  },

  scoringAndGrading: {
    publishExam: {
      publishExam: "publish_exam"
    }
  },
  academic: {
    learningSubject: {
      type: { learningAndExam: 'Learning & Exam', learning: 'Learning', exam: 'Exam', attendence: 'Attendence' }
    },
    schedule: {
      monthList: [
        { Value: 1, Name: 'មករា', NameEn: 'January' },
        { Value: 2, Name: 'កុម្ភ:', NameEn: 'February' },
        { Value: 3, Name: 'មីនា', NameEn: 'March' },
        { Value: 4, Name: 'មេសា', NameEn: 'April' },
        { Value: 5, Name: 'ឧសភា', NameEn: 'May' },
        { Value: 6, Name: 'មិថុនា', NameEn: 'June' },
        { Value: 7, Name: 'កក្កដា', NameEn: 'July' },
        { Value: 8, Name: 'សីហា', NameEn: 'August' },
        { Value: 9, Name: 'កញ្ញា', NameEn: 'September' },
        { Value: 10, Name: 'តុលា', NameEn: 'October' },
        { Value: 11, Name: 'វិច្ឆកា', NameEn: 'November' },
        { Value: 12, Name: 'ធ្នូ', NameEn: 'December' },
        
      ],
      weekList: [
        { Name: 'សប្តាហ៍ទី​ ១', NameEn: 'Week 1', Value: 1 },
        { Name: 'សប្តាហ៍ទី​ ២', NameEn: 'Week 2', Value: 2 },
        { Name: 'សប្តាហ៍ទី​ ៣', NameEn: 'Week 3', Value: 3 },
        { Name: 'សប្តាហ៍ទី​ ៤', NameEn: 'Week 4', Value: 4 },
        { Name: 'សប្តាហ៍ទី​ ៥', NameEn: 'Week 5', Value: 5 },
        { Name: 'សប្តាហ៍ទី​ ៦', NameEn: 'Week 6', Value: 6 },
      ],
      dayOfWeek: [{ Name: 'ថ្ងៃច័ន្ទ', EnglishName: 'Monday' }, { Name: 'ថ្ងៃអង្គារ', EnglishName: 'Tuesday' }, { Name: 'ថ្ងៃពុធ', EnglishName: 'Wednesday' }, { Name: 'ថ្ងៃព្រហស្បតិ៍', EnglishName: 'Thursday' }, { Name: 'ថ្ងៃសុក្រ', EnglishName: 'Friday' }, { Name: 'ថ្ងៃសៅរ៍', EnglishName: 'Satuarday' }, { Name: 'ថ្ងៃអាទិត្យ', EnglishName: 'Sunday' }],
      periodType: {
        dayOfWeek: [{ Name: 'ថ្ងៃច័ន្ទ', EnglishName: 'Monday' }, { Name: 'ថ្ងៃអង្គារ', EnglishName: 'Tuesday' }, { Name: 'ថ្ងៃពុធ', EnglishName: 'Wednesday' }, { Name: 'ថ្ងៃព្រហស្បតិ៍', EnglishName: 'Thursday' }, { Name: 'ថ្ងៃសុក្រ', EnglishName: 'Friday' }, { Name: 'ថ្ងៃសៅរ៍', EnglishName: 'Satuarday' }, { Name: 'ថ្ងៃអាទិត្យ', EnglishName: 'Sunday' }],
        periodType: {
          year: 'Year',
          month: 'Month',
          week: 'Week'
        },
      }
    },
    color: {
      dayOfWeek: {
        background: [
          "rgba(255, 171, 24, 0.03)",
          "rgba(251, 113, 133, 0.03)",
          "rgba(46, 214, 93, 0.03)",
          "rgba(246, 125, 98, 0.03)",
          "rgba(99, 56, 210, 0.03)",
          "rgba(67, 149, 241, 0.03)",
          "rgba(42, 183, 160, 0.03)"
        ],
        primary: ['#ffab18', '#FB7185', '#2ED65D', '#F67D62', '#6338D2', '#4395F1', '#2AB7A0']
      },
    },
  },
  configCheck: {
    global: 'Global',
    branch: 'Branch',
  }
}
