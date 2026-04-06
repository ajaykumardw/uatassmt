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

"use client"

import { useState, useRef, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import { signOut } from "next-auth/react";

import classnames from 'classnames';

import Webcam from "react-webcam";

import { Button, Card, CardContent, CardHeader, Grid } from "@mui/material";

import * as faceapi from "face-api.js";

import frontCommonStyles from './styles.module.css';

import type { Locale } from '@configs/i18n';

import { getLocalizedUrl } from "@/utils/i18n";


const CapturePage = () => {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const { lang: locale } = useParams();
  const defaultImage = '/images/illustrations/characters/4.png';

  const [liveSelfie, setLiveSelfie] = useState<string | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false); // real-time

  // Load face-api models once
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/images/models";

      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      startFaceDetection();
    };

    loadModels();
  }, []);

  // Real-time face detection loop
  const startFaceDetection = () => {
    const detect = async () => {
      if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

        console.log("Face detections:", detections);
        setFaceDetected(detections.length > 0);
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  const captureImage = (type: 'selfie' | 'front' | 'back') => {

    if (!webcamRef.current) return;

    if (type === "selfie" && !faceDetected) {

      alert("No face detected! Please align yourself in front of the camera.");

      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) return;

    if (type === 'selfie') setLiveSelfie(imageSrc);
    else if (type === 'front') setAadhaarFront(imageSrc);
    else setAadhaarBack(imageSrc);
  };

  const handleCaptureComplete = async () => {

    if (!liveSelfie || !aadhaarFront || !aadhaarBack) {

      alert("Please capture all three images before proceeding.");

      return;
    }

    const formdata = new FormData();

    formdata.append("image", liveSelfie);
    formdata.append("id_front_image", aadhaarFront);
    formdata.append("id_back_image", aadhaarBack);

    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image`, {
    //   method: "POST",

    //   // headers: { "Content-Type": "application/json" },

    //   body: formdata,
    // });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/attendance`, {
      method: "POST",

      body: formdata,
    });

    localStorage.setItem("liveSelfie", liveSelfie);
    localStorage.setItem("aadhaarFront", aadhaarFront);
    localStorage.setItem("aadhaarBack", aadhaarBack);

    if (res.ok) router.push("/student-dashboard");
    else console.error("Failed to update capture status");
  };

  const handleUserMediaError = (error: any) => {
    console.error('Error accessing webcam:', error);

    if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
      setCameraError('Camera access was denied. Please allow camera permissions to continue.');
    } else {
      setCameraError('An error occurred while accessing the camera.');
    }
  };

  const handleUserLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push(getLocalizedUrl('/student-login', locale as Locale));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className={classnames('md:plb-[100px] plb-6', frontCommonStyles.layoutSpacing)}>
      <Grid container spacing={6}>
        <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
          <Button
            fullWidth
            variant='contained'
            color='error'
            size='small'
            endIcon={<i className='tabler-logout' />}
            onClick={handleUserLogout}
            sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
            className="w-fit"
          >
            Logout
          </Button>
        </Grid>

        {/* Webcam Section */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardHeader title='Capture Images' />
            <CardContent>
              {cameraError && (
                <div style={{ color: 'red', marginBottom: '1rem' }}>
                  <p>{cameraError}</p>
                  <p>Please ensure you have granted camera permissions.</p>
                </div>
              )}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                mirrored={false}
                videoConstraints={{ facingMode: "user" }}
                onUserMediaError={handleUserMediaError}
                className="rounded"
              />
              <p style={{ color: faceDetected ? 'green' : 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
                {faceDetected ? 'Face Detected ✅' : 'No Face Detected ❌'}
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button variant="contained" onClick={() => captureImage('selfie')} disabled={!faceDetected}>
                  Capture Selfie
                </Button>
                <Button variant="contained" onClick={() => captureImage('front')} disabled={!liveSelfie}>
                  Capture Aadhaar Front
                </Button>
                <Button variant="contained" onClick={() => captureImage('back')} disabled={!aadhaarFront}>
                  Capture Aadhaar Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Display Captured Images */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardHeader title='Live Selfie' />
            <CardContent>
              <img src={liveSelfie || defaultImage} alt="Live Selfie" className="rounded w-full" style={{ background: "aliceblue" }} />
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
        {liveSelfie && aadhaarFront && aadhaarBack && (
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleCaptureComplete}>
              Complete and Go to Dashboard
            </Button>
          </Grid>
        )}
      </Grid>
    </section>
  );
};

export default CapturePage;
