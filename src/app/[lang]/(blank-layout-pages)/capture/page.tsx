// // /app/capture/page.tsx
// "use client"

// import { useState, useRef } from "react";

// import { useParams, useRouter } from "next/navigation";

// import { signOut } from "next-auth/react";

// import classnames from 'classnames'

// import Webcam from "react-webcam";

// import { Button, Card, CardContent, CardHeader, Grid } from "@mui/material";

// import frontCommonStyles from './styles.module.css'

// import type { Locale } from '@configs/i18n'

// import { getLocalizedUrl } from "@/utils/i18n";

// const CapturePage = () => {

//   // const { data: session } = useSession();

//   const router = useRouter();
//   const webcamRef = useRef<Webcam>(null);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const [cameraError, setCameraError] = useState<string | null>(null);

//   // const [permissionDenied, setPermissionDenied] = useState(false);
//   // const [cameraKey, setCameraKey] = useState(Date.now()); // Used to force re-render Webcam component

//   const { lang: locale } = useParams();

//   const defaultImage = '/images/illustrations/characters/4.png'

//   const captureImage = () => {
//     if (webcamRef.current) {
//       const imageSrc = webcamRef.current.getScreenshot();

//       if (imageSrc) {
//         setCapturedImage(imageSrc); // Store captured image in state
//       }
//     }
//   };

//   const handleCaptureComplete = async () => {
//     if (capturedImage) {
//       // Call an API route to update the hasCapturedImage flag in the session
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image`, {
//         method: "POST",
//         body: JSON.stringify({ capturedImage: capturedImage }),
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       localStorage.setItem("studentImage", capturedImage);

//       if (res.ok) {
//         // After updating the session, redirect the user to the dashboard
//         console.log("redirecting to student dashboard **********************************************************")
//         router.push("/student-dashboard");
//       } else {
//         console.error("Failed to update capture status");
//       }
//     }
//   };

//   // const requestCameraPermission = () => {
//   //   setCameraError(null); // Reset the permission denied state
//   //   setCameraKey(Date.now()); // Force re-render the Webcam component to trigger the permission prompt
//   // };

//   // const checkAndRequestPermission = async () => {
//   //   try {
//   //     // Attempt to access the camera
//   //     // const stream = await navigator.mediaDevices.getUserMedia({ video: true });

//   //     // setHasCameraPermission(true);
//   //     // setPermissionDenied(false);
//   //     // stream.getTracks().forEach((track) => track.stop()); // Stop the stream once granted
//   //   } catch (error) {
//   //     console.error("Error accessing camera:", error);
//   //     setPermissionDenied(true); // Permission denied or error occurred
//   //     // setHasCameraPermission(false);
//   //   }
//   // };

//   const handleUserMediaError = (error: any) => {
//     console.error('Error accessing webcam:', error);

//     if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
//       setCameraError('Camera access was denied. Please allow camera permissions to continue.');
//     } else {
//       setCameraError('An error occurred while accessing the camera.');
//     }
//   };

//   const handleUserLogout = async () => {
//     try {
//       // Sign out from the app
//       await signOut({ redirect: false })

//       // Redirect to login page
//       router.push(getLocalizedUrl('/student-login', locale as Locale))
//     } catch (error) {
//       console.error(error)

//       // Show above error in a toast like following
//       // toastService.error((err as Error).message)
//     }
//   }

//   return (
//     <section className={classnames('md:plb-[100px] plb-6', frontCommonStyles.layoutSpacing)}>
//       <Grid container spacing={6}>
//         <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
//           <Button
//             fullWidth
//             variant='contained'
//             color='error'
//             size='small'
//             endIcon={<i className='tabler-logout' />}
//             onClick={handleUserLogout}
//             sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
//             className="w-fit"
//           >
//             Logout
//           </Button>
//         </Grid>
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Capture Your Image' />
//             <CardContent>
//               <Grid container spacing={6}>
//                 <Grid item xs={12}>
//                   {cameraError && (
//                     <div style={{ color: 'red' }}>
//                       <p>{cameraError}</p>
//                       <p>Please ensure you have granted camera permissions.</p>
//                     </div>
//                   )}
//                   <Webcam
//                     audio={false}
//                     ref={webcamRef}
//                     screenshotFormat="image/jpeg"
//                     width="100%"
//                     mirrored={false}
//                     videoConstraints={{
//                       facingMode: "user",
//                     }}
//                     onUserMediaError={handleUserMediaError}
//                     className="rounded"
//                   />
//                 </Grid>
//                 <Grid item xs={12}>
//                   <Button onClick={captureImage} variant="contained">Capture Image</Button>
//                 </Grid>
//               </Grid>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Captured Image' />
//             <CardContent>
//               <Grid container spacing={6}>
//                 <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
//                   {capturedImage ? (
//                     <img src={capturedImage} alt="Captured" className="rounded" />
//                   ) : (
//                     <img src={defaultImage} alt="default" style={{ background: "aliceblue" }} className="rounded" />
//                   )}
//                 </Grid>
//                 <Grid item xs={12}>
//                   <Button onClick={handleCaptureComplete} variant="contained">Complete and Go to Dashboard</Button>
//                 </Grid>
//               </Grid>
//             </CardContent>
//           </Card>
//         </Grid>
//         {/* <Grid item xs={12} sm={6}>
//           <Card>
//             <CardContent>
//                 <h1>Capture Your Image</h1>
//                 {cameraError && (
//                   <>
//                     <div style={{ color: 'red' }}>
//                       <p>{cameraError}</p>
//                       <p>Please ensure you have granted camera permissions.</p>
//                     </div>
//                     <button onClick={checkAndRequestPermission}>
//                       Click to Request Camera Permission
//                     </button>
//                   </>
//                 )}
//                 <Webcam
//                   audio={false}
//                   ref={webcamRef}
//                   screenshotFormat="image/jpeg"
//                   width="100%"
//                   mirrored={true}
//                   videoConstraints={{
//                     facingMode: "user",
//                   }}
//                   onUserMediaError={handleUserMediaError}
//                 />
//                 <button onClick={captureImage}>Capture Image</button>

//                 {capturedImage && (
//                   <div>
//                     <h3>Image Captured</h3>
//                     <img src={capturedImage} alt="Captured" />
//                     <button onClick={handleCaptureComplete}>Complete and Go to Dashboard</button>
//                   </div>
//                 )}
//             </CardContent>
//           </Card>
//         </Grid> */}
//       </Grid>
//     </section>
//   );
// };

// export default CapturePage;

// // /app/capture/page.tsx
// "use client"

// import { useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { signOut } from "next-auth/react";
// import classnames from 'classnames';
// import Webcam from "react-webcam";
// import { Button, Card, CardContent, CardHeader, Grid } from "@mui/material";
// import frontCommonStyles from './styles.module.css';
// import type { Locale } from '@configs/i18n';
// import { getLocalizedUrl } from "@/utils/i18n";

// const CapturePage = () => {
//   const router = useRouter();
//   const webcamRef = useRef<Webcam>(null);
//   const { lang: locale } = useParams();
//   const defaultImage = '/images/illustrations/characters/4.png';

//   // Three captures
//   const [liveSelfie, setLiveSelfie] = useState<string | null>(null);
//   const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
//   const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);

//   const [cameraError, setCameraError] = useState<string | null>(null);

//   const captureImage = (type: 'selfie' | 'front' | 'back') => {
//     if (webcamRef.current) {
//       const imageSrc = webcamRef.current.getScreenshot();
//       if (!imageSrc) return;

//       if (type === 'selfie') setLiveSelfie(imageSrc);
//       else if (type === 'front') setAadhaarFront(imageSrc);
//       else if (type === 'back') setAadhaarBack(imageSrc);
//     }
//   };

//   const handleCaptureComplete = async () => {
//     if (!liveSelfie || !aadhaarFront || !aadhaarBack) {
//       alert("Please capture all three images before proceeding.");
//       return;
//     }

//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ liveSelfie, aadhaarFront, aadhaarBack }),
//     });

//     // Save locally as well
//     localStorage.setItem("liveSelfie", liveSelfie);
//     localStorage.setItem("aadhaarFront", aadhaarFront);
//     localStorage.setItem("aadhaarBack", aadhaarBack);

//     if (res.ok) {
//       console.log("Redirecting to student dashboard...");
//       router.push("/student-dashboard");
//     } else {
//       console.error("Failed to update capture status");
//     }
//   };

//   const handleUserMediaError = (error: any) => {
//     console.error('Error accessing webcam:', error);
//     if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
//       setCameraError('Camera access was denied. Please allow camera permissions to continue.');
//     } else {
//       setCameraError('An error occurred while accessing the camera.');
//     }
//   };

//   const handleUserLogout = async () => {
//     try {
//       await signOut({ redirect: false });
//       router.push(getLocalizedUrl('/student-login', locale as Locale));
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <section className={classnames('md:plb-[100px] plb-6', frontCommonStyles.layoutSpacing)}>
//       <Grid container spacing={6}>
//         <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
//           <Button
//             fullWidth
//             variant='contained'
//             color='error'
//             size='small'
//             endIcon={<i className='tabler-logout' />}
//             onClick={handleUserLogout}
//             sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
//             className="w-fit"
//           >
//             Logout
//           </Button>
//         </Grid>

//         {/* Webcam Section */}
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Capture Images' />
//             <CardContent>
//               {cameraError && (
//                 <div style={{ color: 'red', marginBottom: '1rem' }}>
//                   <p>{cameraError}</p>
//                   <p>Please ensure you have granted camera permissions.</p>
//                 </div>
//               )}
//               <Webcam
//                 audio={false}
//                 ref={webcamRef}
//                 screenshotFormat="image/jpeg"
//                 width="100%"
//                 mirrored={false}
//                 videoConstraints={{ facingMode: "user" }}
//                 onUserMediaError={handleUserMediaError}
//                 className="rounded"
//               />
//               <div className="mt-4 flex gap-2 flex-wrap">
//                 <Button variant="contained" onClick={() => captureImage('selfie')}>Capture Selfie</Button>
//                 <Button variant="contained" onClick={() => captureImage('front')}>Capture Aadhaar Front</Button>
//                 <Button variant="contained" onClick={() => captureImage('back')}>Capture Aadhaar Back</Button>
//               </div>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Display Captured Images */}
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Live Selfie' />
//             <CardContent>
//               <Grid container spacing={2}>
//                 <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
//                   {/* <p>Live Selfie</p> */}
//                   <img src={liveSelfie || defaultImage} alt="Live Selfie" className="rounded w-full" style={{ background: "aliceblue" }} />
//                 </Grid>
//               </Grid>
//             </CardContent>
//           </Card>
//         </Grid>
//         {liveSelfie && (
//           <Grid item xs={12} sm={6}>
//             <Card>
//               <CardHeader title='Aadhaar Front' />
//               <CardContent>
//                 <Grid container spacing={2}>
//                   <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
//                     <img src={aadhaarFront || defaultImage} alt="Aadhaar Front" className="rounded w-full" style={{ background: "aliceblue" }} />
//                   </Grid>
//                 </Grid>
//               </CardContent>
//             </Card>
//           </Grid>
//         )}
//         {aadhaarFront && (
//           <Grid item xs={12} sm={6}>
//             <Card>
//               <CardHeader title='Aadhaar Back' />
//               <CardContent>
//                 <Grid container spacing={2}>
//                   <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
//                     <img src={aadhaarBack || defaultImage} alt="Aadhaar Back" className="rounded w-full" style={{ background: "aliceblue" }} />
//                   </Grid>
//                 </Grid>
//               </CardContent>
//             </Card>
//           </Grid>
//         )}
//         {liveSelfie && aadhaarFront && aadhaarBack && (
//           <Grid item xs={12}>
//             <Button variant="contained" onClick={handleCaptureComplete}>
//               Complete and Go to Dashboard
//             </Button>
//           </Grid>
//         )}
//       </Grid>
//     </section>
//   );
// };

// export default CapturePage;

// "use client"

// import { useState, useRef, useEffect } from "react";

// import { useParams, useRouter } from "next/navigation";

// import { signOut, useSession } from "next-auth/react";

// import classnames from 'classnames';

// import Webcam from "react-webcam";

// // import { Button, Card, CardContent, CardHeader, CircularProgress, Grid } from "@mui/material";

// import Button from "@mui/material/Button";
// import Card from "@mui/material/Card";
// import CardContent from "@mui/material/CardContent";
// import CardHeader from "@mui/material/CardHeader";
// import CircularProgress from "@mui/material/CircularProgress";
// import Grid from "@mui/material/Grid"

// // import * as faceapi from "face-api.js";

// import frontCommonStyles from './styles.module.css';

// import type { Locale } from '@configs/i18n';

// import { getLocalizedUrl } from "@/utils/i18n";


// const CapturePage = () => {
//   const router = useRouter();
//   const webcamRef = useRef<Webcam>(null);
//   const { lang: locale } = useParams();
//   const defaultImage = '/images/illustrations/characters/4.png';

//   const [liveSelfie, setLiveSelfie] = useState<string | null>(null);
//   const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
//   const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);

//   const [cameraError, setCameraError] = useState<string | null>(null);
//   const [faceDetected, setFaceDetected] = useState(false); // real-time
//   const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
//   const [loading, setLoading] = useState(false);

//   const { data: session, status } = useSession();

//   const token = session?.user?.accessToken;

//   console.log("Session token in CapturePage:", token, status);

//   // Load face-api models once
//   useEffect(() => {
//     const loadModels = async () => {
//       const faceapi = await import("face-api.js");
//       const MODEL_URL = "/images/models";

//       await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
//       startFaceDetection(faceapi);
//     };

//     loadModels();
//   }, []);

//   // Real-time face detection loop
//   const startFaceDetection = (faceapi: typeof import("face-api.js")) => {
//     const detect = async () => {
//       if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
//         const video = webcamRef.current.video;
//         const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

//         console.log("Face detections:", detections);
//         setFaceDetected(detections.length > 0);
//       }

//       // requestAnimationFrame(detect);

//       setTimeout(detect, 5000); // Check every 500ms to reduce CPU load
//     };

//     detect();
//   };

//   const switchCamera = () => {

//     setFacingMode(prev => prev === "user" ? "environment" : "user");

//   };

//   const captureImage = (type: 'selfie' | 'front' | 'back') => {

//     if (!webcamRef.current) return;

//     if (type === "selfie" && !faceDetected) {

//       alert("No face detected! Please align yourself in front of the camera.");

//       return;
//     }

//     const imageSrc = webcamRef.current.getScreenshot();

//     if (!imageSrc) return;

//     if (type === 'selfie') setLiveSelfie(imageSrc);
//     else if (type === 'front') setAadhaarFront(imageSrc);
//     else setAadhaarBack(imageSrc);
//   };

//   const base64ToFile = (base64:string, filename:string)=>{

//     const arr = base64.split(',')

//     const mime =
//       arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"

//     const bstr =
//       atob(arr[1])

//     let n = bstr.length

//     const u8arr = new Uint8Array(n)

//     while(n--){
//       u8arr[n] = bstr.charCodeAt(n)
//     }

//     return new File(
//       [u8arr],
//       filename,
//       {type:mime}
//     )

//   }

//   const handleCaptureComplete = async () => {
//     setLoading(true);

//     if (!liveSelfie || !aadhaarFront || !aadhaarBack) {

//       alert("Please capture all three images before proceeding.");

//       setLoading(false);

//       return;
//     }

//     try {

//       const formdata = new FormData();

//       const selfieFile = base64ToFile(liveSelfie, "selfie.jpg");
//       const frontFile = base64ToFile(aadhaarFront, "aadhaar_front.jpg");
//       const backFile = base64ToFile(aadhaarBack, "aadhaar_back.jpg");

//       formdata.append("image", selfieFile);
//       formdata.append("id_front_image", frontFile);
//       formdata.append("id_back_image", backFile);

//       // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image`, {
//       //   method: "POST",

//       //   // headers: { "Content-Type": "application/json" },

//       //   body: formdata,
//       // });

//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/attendance`, {
//         method: "POST",

//         headers: {
//           "authorization": `Bearer ${token || ""}`
//         },

//         body: formdata,
//       });

//       localStorage.setItem("liveSelfie", liveSelfie);
//       localStorage.setItem("aadhaarFront", aadhaarFront);
//       localStorage.setItem("aadhaarBack", aadhaarBack);

//       if (res.ok) router.push("/student-dashboard");
//       else console.error("Failed to update capture status");

//     } catch (error) {

//       console.error("Error during capture complete:", error);

//       alert("An error occurred while submitting your images. Please try again.");

//     } finally {

//       setLoading(false);
//     }

//   };

//   const handleUserMediaError = (error: any) => {
//     console.error('Error accessing webcam:', error);

//     if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
//       setCameraError('Camera access was denied. Please allow camera permissions to continue.');
//     } else {
//       setCameraError('An error occurred while accessing the camera.');
//     }
//   };

//   const handleUserLogout = async () => {
//     try {
//       await signOut({ redirect: false });
//       router.push(getLocalizedUrl('/student-login', locale as Locale));
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <section className={classnames('md:plb-[100px] plb-6', frontCommonStyles.layoutSpacing)}>
//       <Grid container spacing={6}>
//         <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
//           <Button
//             fullWidth
//             variant='contained'
//             color='error'
//             size='small'
//             endIcon={<i className='tabler-logout' />}
//             onClick={handleUserLogout}
//             sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
//             className="w-fit"
//           >
//             Logout
//           </Button>
//         </Grid>

//         {/* Webcam Section */}
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Capture Images' />
//             <CardContent>
//               {cameraError && (
//                 <div style={{ color: 'red', marginBottom: '1rem' }}>
//                   <p>{cameraError}</p>
//                   <p>Please ensure you have granted camera permissions.</p>
//                 </div>
//               )}
//               <Webcam
//                 audio={false}
//                 ref={webcamRef}
//                 screenshotFormat="image/jpeg"
//                 width="100%"
//                 mirrored={false}
//                 videoConstraints={{
//                   facingMode: facingMode
//                 }}
//                 key={facingMode}
//                 onUserMediaError={handleUserMediaError}
//                 className="rounded"
//               />
//               <p style={{ color: faceDetected ? 'green' : 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
//                 {faceDetected ? 'Face Detected ✅' : 'No Face Detected ❌'}
//               </p>
//               <div className="mt-4 flex gap-2 flex-wrap">
//                 <Button
//                   variant="outlined"
//                   onClick={switchCamera}
//                 >
//                   Switch Camera
//                 </Button>
//                 <Button variant="contained" onClick={() => captureImage('selfie')} disabled={!faceDetected && facingMode === "user"}>
//                   Capture Selfie {liveSelfie && "✅"}
//                 </Button>
//                 <Button variant="contained" onClick={() => captureImage('front')} disabled={!liveSelfie}>
//                   Capture Aadhaar Front {aadhaarFront && "✅"}
//                 </Button>
//                 <Button variant="contained" onClick={() => captureImage('back')} disabled={!aadhaarFront}>
//                   Capture Aadhaar Back {aadhaarBack && "✅"}
//                 </Button>
//                 {liveSelfie && aadhaarFront && aadhaarBack && (
//                   <Button variant="contained" color="success" onClick={handleCaptureComplete} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
//                     Complete and Go to Dashboard
//                   </Button>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Display Captured Images */}
//         <Grid item xs={12} sm={6}>
//           <Card>
//             <CardHeader title='Live Selfie' />
//             <CardContent>
//               <Grid container spacing={2}>
//                 <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
//                   <img src={liveSelfie || defaultImage} alt="Live Selfie" className="rounded w-full" style={{ background: "aliceblue" }} />
//                 </Grid>
//               </Grid>
//             </CardContent>
//           </Card>
//         </Grid>
//         {aadhaarFront && (
//           <Grid item xs={12} sm={6}>
//             <Card>
//               <CardHeader title='Aadhaar Front' />
//               <CardContent>
//                 <img src={aadhaarFront || defaultImage} alt="Aadhaar Front" className="rounded w-full" style={{ background: "aliceblue" }} />
//               </CardContent>
//             </Card>
//           </Grid>
//         )}
//         {aadhaarBack && (
//           <Grid item xs={12} sm={6}>
//             <Card>
//               <CardHeader title='Aadhaar Back' />
//               <CardContent>
//                 <img src={aadhaarBack || defaultImage} alt="Aadhaar Back" className="rounded w-full" style={{ background: "aliceblue" }} />
//               </CardContent>
//             </Card>
//           </Grid>
//         )}
//       </Grid>
//     </section>
//   );
// };

// export default CapturePage;

"use client";

import { useState, useRef, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import { signOut, useSession } from "next-auth/react";

import classnames from "classnames";
import Webcam from "react-webcam";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";

import frontCommonStyles from "./styles.module.css";

import type { Locale } from "@configs/i18n";

import { getLocalizedUrl } from "@/utils/i18n";

const CapturePage = () => {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { lang: locale } = useParams();
  const defaultImage = "/images/illustrations/characters/4.png";

  const [liveSelfie, setLiveSelfie] = useState<string | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [loading, setLoading] = useState(false);

  const [lat, setLat] = useState<string>("Fetching...");
  const [long, setLong] = useState<string>("Fetching...");
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState<string>("Fetching address...");

  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // ✅ Face Detection with overlay
  useEffect(() => {
    let isMounted = true;
    let lastDetectionTime = 0;

    const loadModelsAndStart = async () => {
      const faceapi = await import("face-api.js");
      const MODEL_URL = "/images/models";

      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

      const detect = async () => {
        if (!isMounted) return;

        const now = Date.now();

        // throttle (300ms)
        if (now - lastDetectionTime < 300) {
          requestAnimationFrame(detect);

          return;
        }

        lastDetectionTime = now;

        if (
          webcamRef.current &&
          webcamRef.current.video?.readyState === 4 &&
          canvasRef.current
        ) {
          const video = webcamRef.current.video;
          const canvas = canvasRef.current;

          const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight,
          };

          faceapi.matchDimensions(canvas, displaySize);

          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          const resized = faceapi.resizeResults(detections, displaySize);

          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resized);
          }

          setFaceDetected(detections.length === 1);
          setMultipleFaces(detections.length > 1);
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    loadModelsAndStart();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // ⏱️ Live Time
    const interval = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    // 📍 Get Location
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLong(pos.coords.longitude.toFixed(5));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude.toFixed(5)}&lon=${pos.coords.longitude.toFixed(5)}&format=json`
          );

          const data = await res.json();

          const addr = data.address;

          const fullAddress = `
            ${addr?.neighbourhood+", " || ""}
            ${addr?.city+", " || addr?.town+", " || addr?.village+", " || ""}
            ${addr?.state+", " || ""}
            ${addr?.country || ""} ${addr?.postcode ? " - "+addr.postcode : ""}
          `.replace(/\n/g, " ").trim();

          setAddress(fullAddress);
        } catch (err) {
          console.error(err);
          setAddress("Address not available");
        }
      },
      () => {
        setLat("Denied");
        setLong("Denied");
        setAddress("Denied");
      }
    );

    return () => clearInterval(interval);
  }, []);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // const captureImage = (type: "selfie" | "front" | "back") => {
  //   if (!webcamRef.current) return;

  //   if (type === "selfie" && !faceDetected) {

  //     alert("Ensure exactly one face is visible.");

  //     return;
  //   }

  //   const imageSrc = webcamRef.current.getScreenshot();

  //   if (!imageSrc) return;

  //   if (type === "selfie") setLiveSelfie(imageSrc);
  //   else if (type === "front") setAadhaarFront(imageSrc);
  //   else setAadhaarBack(imageSrc);
  // };

  // const captureImage = (type: "selfie" | "front" | "back") => {
  //   if (!webcamRef.current) return;

  //   if (type === "selfie" && !faceDetected) {
  //     alert("Ensure exactly one face is visible.");
  //     return;
  //   }

  //   const video = webcamRef.current.video;
  //   const canvas = document.createElement("canvas");
  //   const ctx = canvas.getContext("2d");

  //   if (!video || !ctx) return;

  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;

  //   // 🖼️ Draw video frame
  //   ctx.drawImage(video, 0, 0);

  //   // 📍 Overlay background
  //   ctx.fillStyle = "rgba(0,0,0,0.6)";
  //   ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

  //   // ✍️ Text
  //   ctx.fillStyle = "#00FFCC";
  //   ctx.font = "16px monospace";

  //   ctx.fillText(`Lat: ${lat}, Long: ${long}`, 10, canvas.height - 70);
  //   ctx.fillText(`Time: ${time}`, 10, canvas.height - 45);
  //   ctx.fillText(`👤 ID: ${session?.user?.id}`, 10, canvas.height - 20);

  //   const finalImage = canvas.toDataURL("image/jpeg", 0.85);

  //   if (type === "selfie") setLiveSelfie(finalImage);
  //   else if (type === "front") setAadhaarFront(finalImage);
  //   else setAadhaarBack(finalImage);
  // };

  // const captureImage = (type: "selfie" | "front" | "back") => {
  //   if (!webcamRef.current) return;

  //   if (type === "selfie" && !faceDetected) {

  //     alert("Ensure exactly one face is visible.");

  //     return;
  //   }

  //   const video = webcamRef.current.video;
  //   const canvas = document.createElement("canvas");
  //   const ctx = canvas.getContext("2d");

  //   if (!video || !ctx) return;

  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;

  //   // 🖼️ Draw video frame
  //   ctx.drawImage(video, 0, 0);

  //   // ===== ✅ UI STYLE OVERLAY START =====

  //   const paddingX = 12;
  //   const paddingY = 8;
  //   const fontSize = 20;
  //   const lineHeight = 24; // tuned for canvas

  //   ctx.font = `${fontSize}px monospace`;

  //   const lines = [
  //     `🏠 ${address}`,
  //     `📍 ${lat}, ${long}`,
  //     `🕒 ${time}`,
  //     `👤 ID: ${session?.user?.id}`
  //   ];

  //   // 📏 calculate width based on text
  //   let maxWidth = 0;
  //   lines.forEach((line) => {
  //     const w = ctx.measureText(line).width;
  //     if (w > maxWidth) maxWidth = w;
  //   });

  //   const boxWidth = maxWidth + paddingX * 2;
  //   const boxHeight = lines.length * lineHeight + paddingY * 2;

  //   // 📍 position (same as your div: bottom-left)
  //   const x = 10;
  //   const y = canvas.height - boxHeight - 10;

  //   // 🎨 background with rounded corners
  //   ctx.fillStyle = "rgba(0,0,0,0.6)";
  //   ctx.beginPath();
  //   ctx.roundRect(x, y, boxWidth, boxHeight, 6);
  //   ctx.fill();

  //   // ✍️ text
  //   ctx.fillStyle = "#00FFCC";

  //   lines.forEach((line, i) => {
  //     ctx.fillText(
  //       line,
  //       x + paddingX,
  //       y + paddingY + (i + 1) * lineHeight - 4
  //     );
  //   });

  //   // ===== ✅ UI STYLE OVERLAY END =====

  //   const finalImage = canvas.toDataURL("image/jpeg", 0.85);

  //   if (type === "selfie") setLiveSelfie(finalImage);
  //   else if (type === "front") setAadhaarFront(finalImage);
  //   else setAadhaarBack(finalImage);
  // };

  const captureImage = (type: "selfie" | "front" | "back") => {
    if (!webcamRef.current) return;

    if (type === "selfie" && !faceDetected) {
      alert("Ensure exactly one face is visible.");

      return;
    }

    const video = webcamRef.current.video;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!video || !ctx) return;

    // ✅ Fix blur using devicePixelRatio
    const dpr = window.devicePixelRatio || 1;

    canvas.width = video.videoWidth * dpr;
    canvas.height = video.videoHeight * dpr;

    canvas.style.width = `${video.videoWidth}px`;
    canvas.style.height = `${video.videoHeight}px`;

    ctx.scale(dpr, dpr);

    // 🖼️ Draw video
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // ===== UI STYLE OVERLAY =====

    const paddingX = 12;
    const paddingY = 8;
    const fontSize = 20;
    const lineHeight = 26;

    // ✅ Better font rendering
    ctx.font = `${fontSize}px Arial`; // monospace looks jagged sometimes
    ctx.textBaseline = "top";

    const lines = [
      `${address}`,
      `Lat ${lat} Long ${long}`,
      `${time}`,
    ];

    let maxWidth = 0;

    lines.forEach((line) => {
      const w = ctx.measureText(line).width;

      if (w > maxWidth) maxWidth = w;
    });

    const boxWidth = maxWidth + paddingX * 2;
    const boxHeight = lines.length * lineHeight + paddingY * 2;

    const x = 10;
    const y = video.videoHeight - boxHeight - 10;

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 6);
    ctx.fill();

    // Text
    ctx.fillStyle = "#ffffff";

    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        x + paddingX,
        y + paddingY + i * lineHeight
      );
    });

    // ===== END =====

    const finalImage = canvas.toDataURL("image/jpeg", 0.9);

    if (type === "selfie") setLiveSelfie(finalImage);
    else if (type === "front") setAadhaarFront(finalImage);
    else setAadhaarBack(finalImage);
  };

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) u8arr[n] = bstr.charCodeAt(n);

    return new File([u8arr], filename, { type: mime });
  };

  const handleCaptureComplete = async () => {
    setLoading(true);

    if (!liveSelfie || !aadhaarFront || !aadhaarBack) {
      alert("Capture all images first.");
      setLoading(false);

      return;
    }

    try {
      const formdata = new FormData();

      formdata.append("image", base64ToFile(liveSelfie, "selfie.jpg"));
      formdata.append("id_front_image", base64ToFile(aadhaarFront, "front.jpg"));
      formdata.append("id_back_image", base64ToFile(aadhaarBack, "back.jpg"));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students/attendance`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token || ""}`,
          },
          body: formdata,
        }
      );

      if (res.ok) {
        router.push("/student-dashboard");
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setLoading(false);
    }
  };

  const handleUserMediaError = (error: any) => {
    if (error.name === "NotAllowedError") {
      setCameraError("Camera permission denied.");
    } else {
      setCameraError("Camera error occurred.");
    }
  };

  const handleUserLogout = async () => {
    await signOut({ redirect: false });
    router.push(getLocalizedUrl("/student-login", locale as Locale));
  };

  return (
    <section className={classnames("md:plb-[100px] plb-6", frontCommonStyles.layoutSpacing)}>
      <Grid container spacing={6}>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button color="error" size="small" onClick={handleUserLogout}>
            Logout
          </Button>
        </Grid>

        {/* Webcam */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardHeader title="Capture Images" />
            <CardContent>
              {cameraError && <p style={{ color: "red" }}>{cameraError}</p>}

              <div style={{ position: "relative", width: "100%" }}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  mirrored={false}
                  videoConstraints={{ facingMode }}
                  key={facingMode}
                  onUserMediaError={handleUserMediaError}
                />

                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    background: "rgba(0,0,0,0.6)",
                    color: "#ffffff",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    borderRadius: "6px",
                    lineHeight: "1.4"
                  }}
                >
                  <div>{address}</div>
                  <div>Lat {lat} Long {long}</div>
                  <div>{time}</div>
                </div>
              </div>

              <p style={{ color: faceDetected ? "green" : "red", fontWeight: "bold" }}>
                {faceDetected ? "Single Face Detected ✅" : "No / Multiple Faces ❌"}
              </p>

              {multipleFaces && (
                <p style={{ color: "orange" }}>Multiple faces detected ⚠️</p>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                <Button
                  variant="outlined"
                  onClick={switchCamera}
                >
                  Switch Camera
                </Button>
                <Button variant="contained" onClick={() => captureImage('selfie')} disabled={!faceDetected && facingMode === "user"}>
                  Capture Selfie {liveSelfie && "✅"}
                </Button>
                <Button variant="contained" onClick={() => captureImage('front')} disabled={!liveSelfie}>
                  Capture Aadhaar Front {aadhaarFront && "✅"}
                </Button>
                <Button variant="contained" onClick={() => captureImage('back')} disabled={!aadhaarFront}>
                  Capture Aadhaar Back {aadhaarBack && "✅"}
                </Button>
                {liveSelfie && aadhaarFront && aadhaarBack && (
                  <Button variant="contained" color="success" onClick={handleCaptureComplete} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
                    Complete and Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Display Captured Images */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardHeader title='Live Selfie' />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} className={classnames(frontCommonStyles.defaultImageDiv)}>
                  <img src={liveSelfie || defaultImage} alt="Live Selfie" className="rounded w-full" style={{ background: "aliceblue" }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {aadhaarFront && (
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader title='Aadhaar Front' />
              <CardContent>
                <img src={aadhaarFront || defaultImage} alt="Aadhaar Front" className="rounded w-full" style={{ background: "aliceblue" }} />
              </CardContent>
            </Card>
          </Grid>
        )}
        {aadhaarBack && (
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader title='Aadhaar Back' />
              <CardContent>
                <img src={aadhaarBack || defaultImage} alt="Aadhaar Back" className="rounded w-full" style={{ background: "aliceblue" }} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </section>
  );
};

export default CapturePage;
