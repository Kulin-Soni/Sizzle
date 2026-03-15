import { MdFilledButton } from "react-material-web"


const Footer = () => {
 return (
  <div className='w-full flex justify-center gap-2 p-5 pt-0'>
   <MdFilledButton className="transition-colors duration-300 w-1/2 text-[12px] font-google_bold font-bold flex justify-center items-center uppercase" onClick={()=>{window.open("https://example.com", "_blank")}}>How to use</MdFilledButton>
   <MdFilledButton className="transition-colors duration-300 w-1/2 text-[12px] font-google_bold font-bold flex justify-center items-center uppercase" onClick={()=>{window.open("https://example.com", "_blank")}}>Report issue</MdFilledButton>
  </div>
 )
}

export default Footer
