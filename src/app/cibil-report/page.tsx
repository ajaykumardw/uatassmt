// "use client"

// import { useState, ChangeEvent, FormEvent } from "react"

// interface FormData {
//   name: string
//   dob: string
//   pan: string
//   mobile: string
//   email: string
// }

// const CibilReportPage = () => {
//   const [formData, setFormData] = useState<FormData>({
//     name: "",
//     dob: "",
//     pan: "",
//     mobile: "",
//     email: "",
//   })
//   const [isLoading, setIsLoading] = useState(false)

//   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault()
//     setIsLoading(true)
//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 1500))
//     console.log("Form submitted:", formData)
//     setIsLoading(false)
//     alert("CIBIL check request submitted!")
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
//       <div className="max-w-md mx-auto">
//         {/* Header Card */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//                 />
//               </svg>
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold">CIBIL Score Check</h1>
//               <p className="text-blue-100 text-sm">Free credit report</p>
//             </div>
//           </div>
//           <p className="text-blue-100 text-sm mt-4">
//             Get your credit score instantly. Your information is secure and encrypted.
//           </p>
//         </div>

//         {/* Form Card */}
//         <div className="bg-white rounded-b-2xl shadow-xl shadow-blue-900/10 p-6">
//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Full Name */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-gray-700">
//                 Full Name
//                 <span className="text-red-500 ml-0.5">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//                 placeholder="Enter your full name"
//                 className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//               />
//             </div>

//             {/* Date of Birth */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-gray-700">
//                 Date of Birth
//                 <span className="text-red-500 ml-0.5">*</span>
//               </label>
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//               />
//             </div>

//             {/* PAN Number */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-gray-700">
//                 PAN Number
//                 <span className="text-red-500 ml-0.5">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="pan"
//                 value={formData.pan}
//                 onChange={handleChange}
//                 required
//                 placeholder="ABCDE1234F"
//                 maxLength={10}
//                 className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tracking-wider"
//               />
//               <p className="text-xs text-gray-500">Format: 5 letters, 4 digits, 1 letter</p>
//             </div>

//             {/* Mobile Number */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-gray-700">
//                 Mobile Number
//                 <span className="text-red-500 ml-0.5">*</span>
//               </label>
//               <div className="flex">
//                 <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium">
//                   +91
//                 </span>
//                 <input
//                   type="tel"
//                   name="mobile"
//                   value={formData.mobile}
//                   onChange={handleChange}
//                   required
//                   pattern="[0-9]{10}"
//                   placeholder="9876543210"
//                   maxLength={10}
//                   className="w-full border border-gray-200 rounded-r-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//                 />
//               </div>
//             </div>

//             {/* Email Address */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-gray-700">
//                 Email Address
//                 <span className="text-red-500 ml-0.5">*</span>
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//                 placeholder="you@example.com"
//                 className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//               />
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
//             >
//               {isLoading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <svg
//                     className="animate-spin h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     />
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     />
//                   </svg>
//                   Checking...
//                 </span>
//               ) : (
//                 "Check My CIBIL Score"
//               )}
//             </button>
//           </form>

//           {/* Trust Indicators */}
//           <div className="mt-6 pt-6 border-t border-gray-100">
//             <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
//               <div className="flex items-center gap-1.5">
//                 <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                 </svg>
//                 <span>256-bit SSL</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span>100% Secure</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span>Free Check</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer Note */}
//         <p className="text-center text-xs text-gray-500 mt-6 px-4">
//           Your credit score won't be affected by checking your own report.
//           We never share your data with third parties.
//         </p>
//       </div>
//     </div>
//   )
// }

// export default CibilReportPage


// "use client"

// import { useState, type ChangeEvent, type FormEvent } from "react"

// import jsPDF from "jspdf"

// interface FormData {
//   name: string
//   dob: string
//   pan: string
//   mobile: string
//   email: string
// }

// const CibilReportPage = () => {
//   const [formData, setFormData] = useState<FormData>({
//     name: "",
//     dob: "",
//     pan: "",
//     mobile: "",
//     email: "",
//   })

//   const [isLoading, setIsLoading] = useState(false)
//   const [score, setScore] = useState<number | null>(null)

//   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target

//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault()
//     setIsLoading(true)

//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 1500))

//     // Demo: random score between 300–900
//     const randomScore = Math.floor(Math.random() * (900 - 300 + 1)) + 300

//     setScore(randomScore)

//     setIsLoading(false)
//   }

//   const downloadPDF = () => {
//     const doc = new jsPDF()

//     doc.setFontSize(18)
//     doc.text("CIBIL Report", 20, 20)

//     doc.setFontSize(12)
//     doc.text(`Name: ${formData.name}`, 20, 40)
//     doc.text(`DOB: ${formData.dob}`, 20, 50)
//     doc.text(`PAN: ${formData.pan}`, 20, 60)
//     doc.text(`Mobile: ${formData.mobile}`, 20, 70)
//     doc.text(`Email: ${formData.email}`, 20, 80)

//     doc.setFontSize(14)
//     doc.text(`CIBIL Score: ${score}`, 20, 100)

//     doc.save("CIBIL_Report.pdf")
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
//       <div className="max-w-md mx-auto">
//         {/* Form UI */}
//         {!score && (
//           <div className="bg-white rounded-2xl shadow-xl p-6">
//             <h1 className="text-2xl font-bold mb-4">CIBIL Score Check</h1>
//             <form onSubmit={handleSubmit} className="space-y-5">
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Full Name"
//                 required
//                 className="w-full border rounded px-3 py-2"
//               />
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleChange}
//                 required
//                 className="w-full border rounded px-3 py-2"
//               />
//               <input
//                 type="text"
//                 name="pan"
//                 value={formData.pan}
//                 onChange={handleChange}
//                 placeholder="PAN Number"
//                 required
//                 className="w-full border rounded px-3 py-2 uppercase"
//               />
//               <input
//                 type="tel"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 placeholder="Mobile Number"
//                 required
//                 className="w-full border rounded px-3 py-2"
//               />
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Email Address"
//                 required
//                 className="w-full border rounded px-3 py-2"
//               />

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
//               >
//                 {isLoading ? "Checking..." : "Check My Score"}
//               </button>
//             </form>
//           </div>
//         )}

//         {/* Response UI */}
//         {score && (
//           <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
//             <h2 className="text-xl font-bold mb-2">Your CIBIL Score</h2>
//             <div className="text-6xl font-extrabold text-blue-600 mb-4">
//               {score}
//             </div>
//             <p className="text-gray-600 mb-6">
//               {score >= 750
//                 ? "Excellent! You have a strong credit profile."
//                 : score >= 650
//                 ? "Good! You may be eligible for most loans."
//                 : score >= 550
//                 ? "Fair. Improve repayment history for better chances."
//                 : "Poor. Work on clearing dues and improving credit habits."}
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={downloadPDF}
//                 className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
//               >
//                 Download PDF
//               </button>
//               <button
//                 onClick={() => setScore(null)}
//                 className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition"
//               >
//                 Check Again
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default CibilReportPage


"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"

// import jsPDF from "jspdf"

interface FormData {
  first_name: string
  last_name: string
  dob: string
  pan: string
  phone: string
  email: string
  street_address: string
  city: string
  postal_code: string
  region: string
}


// Region codes constant
const REGION_CODES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
]

const CibilReportPage = () => {
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    dob: "",
    pan: "",
    phone: "",
    email: "",
    street_address: "",
    city: "",
    postal_code: "",
    region: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Call backend API route
    const res = await fetch("/cibil-report/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    console.log("CIBIL API Response:", data)

    // Extract report URL if available
    setReportUrl(data?.data?.data?.htmlUrl || null)

    setIsLoading(false)
  }

  // const downloadPDF = () => {
  //   const doc = new jsPDF()

  //   doc.setFontSize(18)
  //   doc.text("CIBIL Report", 20, 20)

  //   doc.setFontSize(12)
  //   doc.text(`Name: ${formData.first_name} ${formData.last_name}`, 20, 40)
  //   doc.text(`DOB: ${formData.dob}`, 20, 50)
  //   doc.text(`PAN: ${formData.pan}`, 20, 60)
  //   doc.text(`Phone: ${formData.phone}`, 20, 70)
  //   doc.text(`Email: ${formData.email}`, 20, 80)
  //   doc.text(`Address: ${formData.street_address}, ${formData.city}`, 20, 90)
  //   doc.text(`Postal Code: ${formData.postal_code}`, 20, 100)
  //   doc.text(`Region: ${formData.region}`, 20, 110)

  //   if (reportUrl) {
  //     doc.text(`Report URL: ${reportUrl}`, 20, 130)
  //   }

  //   doc.save("CIBIL_Report.pdf")
  // }

  const handleRegionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {!reportUrl && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Generate CIBIL Report</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" required className="w-full border rounded px-3 py-2" />
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" required className="w-full border rounded px-3 py-2" />
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              <input type="text" name="pan" value={formData.pan} onChange={handleChange} placeholder="PAN Number" required className="w-full border rounded px-3 py-2 uppercase" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required className="w-full border rounded px-3 py-2" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full border rounded px-3 py-2" />
              <input type="text" name="street_address" value={formData.street_address} onChange={handleChange} placeholder="Street Address" required className="w-full border rounded px-3 py-2" />
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" required className="w-full border rounded px-3 py-2" />
              <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Postal Code" required className="w-full border rounded px-3 py-2" />
              {/* <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="Region Code (e.g. 28)" required className="w-full border rounded px-3 py-2" /> */}
              <select name="region" value={formData.region} onChange={handleRegionChange} required className="w-full border rounded px-3 py-2">
                <option value="" disabled>Select Region</option>
                {REGION_CODES.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name} ({region.code})
                  </option>
                ))}
              </select>
              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                {isLoading ? "Generating..." : "Generate Report"}
              </button>
            </form>
          </div>
        )}

        {reportUrl && (
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <h2 className="text-xl font-bold mb-2">CIBIL Report Generated</h2>
            <p className="text-gray-600 mb-6">Your report is ready. Click below to view.</p>
            <div className="flex justify-center gap-4">
              <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                View Report
              </a>
              <button onClick={() => setReportUrl(null)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition">
                Check Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CibilReportPage
