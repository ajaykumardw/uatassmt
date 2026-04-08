"use client"

import { useEffect, useRef, useState } from "react";

import SignatureCanvas from "react-signature-canvas";

import { Button, FormHelperText } from "@mui/material";

type SignaturePadProps = {
  value?: File | null
  onChange:(file:File | null)=>void
  error?:string
  height?:number
  disabled?:boolean
  showControls?:boolean
}

export default function SignaturePad({

  onChange,
  error,
  height = 260,
  disabled = false,
  showControls = true

}:SignaturePadProps){

  const sigRef = useRef<SignatureCanvas | null>(null)

  const [saved,setSaved] = useState(false)

  const base64ToFile = (base64:string, filename:string)=>{

    const arr = base64.split(',')

    const mime =
      arr[0].match(/:(.*?);/)?.[1] || "image/png"

    const bstr =
      atob(arr[1])

    let n = bstr.length

    const u8arr = new Uint8Array(n)

    while(n--){
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new File(
      [u8arr],
      filename,
      {type:mime}
    )

  }

  const save = ()=>{

    if(!sigRef.current) return

    if(sigRef.current.isEmpty()){
      onChange(null)
      setSaved(false)

      return
    }

    const base64 = sigRef.current
      .getCanvas()
      .toDataURL("image/png")

    const file = base64ToFile(
      base64,
      `candidate_signature.png`
    )

    onChange(file)

    setSaved(true)
  }

  const clear = ()=>{

    sigRef.current?.clear()

    onChange(null)

    setSaved(false)
  }

  // const undo = ()=>{

  //   if(!sigRef.current) return

  //   const data = sigRef.current.toData()

  //   if(data.length === 0) return

  //   data.pop()

  //   sigRef.current.fromData(data)

  //   setSaved(false)
  // }

  useEffect(()=>{

    const resize = ()=>{

      const canvas = sigRef.current?.getCanvas()

      if(!canvas) return

      const ratio = Math.max(window.devicePixelRatio,1)

      canvas.width = canvas.offsetWidth * ratio

      canvas.height = canvas.offsetHeight * ratio

      canvas.getContext("2d")?.scale(ratio,ratio)

    }

    resize()

    window.addEventListener("resize",resize)

    return ()=>window.removeEventListener("resize",resize)

  },[])

  return (

    <div>

      <div className="border rounded bg-white">

        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            className:`w-full`,
            style:{height}
          }}
        />

      </div>

      {showControls && !disabled && (

        <div className="flex gap-2 mt-2">

          <Button
            size="small"
            variant="outlined"
            onClick={clear}
          >
            Clear
          </Button>

          {/* <Button
            size="small"
            variant="outlined"
            onClick={undo}
          >
            Undo
          </Button> */}

          <Button
            size="small"
            variant="contained"
            onClick={save}
            disabled={sigRef.current?.isEmpty()}
          >
            Save
          </Button>

        </div>

      )}

      {saved && (
        <div className="text-green-600 text-sm mt-1">
          Signature saved ✓
        </div>
      )}

      {error && (

        <FormHelperText error>
          {error}
        </FormHelperText>

      )}

    </div>

  )
}
