'use client'

import React,{useState,useEffect,Suspense,createContext,useContext, ChangeEvent, KeyboardEvent } from 'react'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"

import Link from "next/link";


function openSecondWindow() {
  const secondWindow = window.open(
    'about:blank', // Open a blank page
    'second-window', // Unique name for the window
    'width=800,height=600' // Window size and features
  );

  if (secondWindow) {
    secondWindow.document.title = 'Secondary Display';
  }
}

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check,AArrowDown, ChevronDownIcon , ChevronsDown} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"



function SettingPrintPage() {

   const [listM, setlistM] = useState("")
   const [print, setPrint] = useState([])

   const [idc, setidss] = useState({idcus:"",pay:"หน้าร้าน",printcode:String(print[0])})
   //console.log(print)

   const frameworks = [
  {
    value: print[0],
    label: print[0],
  },
  {
    value: print[1],
    label: print[1],
  },
  {
    value: print[2],
    label: print[2],
  }

]

useEffect(  () => {
      
    const useMyHook = async () => {
      try {
        SetPrinter()
    } catch (e) {
        console.error(e);
    }}
    
   useMyHook()
 
    }, [])




    const SetPrinter=async()=>{

                try {
            const httpResponse = await fetch("http://localhost:8000/impresoras");
            const printerList = await httpResponse.json();
            console.log(printerList);
            setPrint(printerList);
            setidss({...idc,printcode:printerList});
        } catch (e) {
            // The plugin did not answer
            console.log(e)
        }
              
    }

 const PrintS=async()=>{

  
  try {
      const operations = [
          {
              nombre: "",
              argumentos: ["Hello\nPrinter"],
          }
      ];
      const printerName =String(idc.printcode);
      const payload = {
          serial: "",
          operaciones: operations,
          nombreImpresora: printerName,
      };
      const httpResponse = await fetch("http://localhost:8000/imprimir", {
          method: "POST",
          body: JSON.stringify(payload),
      });
      const response = await httpResponse.json();
      if (response.ok) {
          console.log("Printed successfully");
      } else {
          console.error(response.message);
      }
  } catch (e) {
      console.log(e)
  }
 }



  //*******Func Sex********************** */
     function Payinput() {
              const [open, setOpen] = React.useState(false)
              const [value, setValue] = React.useState("")
              return (
                  <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                      <Button
                      variant="outline"
                      role="combobox"
                      name="prints"
                      disabled={Number(listM)>=1? true:false}
                      aria-expanded={open}
                      className="rounded  "
                      style={{fontFamily:"Kanit",fontSize:12,width:160,height:30}}
                      >
  
                      {idc.printcode ? idc.printcode : "เครื่องปริ้น" }
                      <ChevronDownIcon className="opacity-70" style={{marginLeft:5}}/>
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                      <Command>
                      <CommandInput placeholder="เครื่องปริ้น" className="h-9" />
                      <CommandList>
                          <CommandEmpty>No framework found.</CommandEmpty>
                          <CommandGroup>
                          {frameworks.map((framework) => (
                              <CommandItem
                              key={framework.value}
                              value={framework.value}
                              onSelect={(currentValue) => {
                                  setValue(currentValue === value ? "" : currentValue)
                                  setidss({...idc,printcode:currentValue === value ? "" : currentValue,});
                                  setOpen(false)
                                   
                              }}
                              >
                              {framework.label}
                              <Check
                                  className={cn(
                                  "ml-auto",
                                  value === framework.value ? "opacity-100" : "opacity-0"
                                  )}
                              />
                              </CommandItem>
                          ))}
                          </CommandGroup>
                      </CommandList>
                      </Command>
                  </PopoverContent>
                  </Popover>
              )
              }
    

    return (
        <div style={{paddingLeft: 15, paddingRight: 15}} className="" >

                        <div className="row-sm justify-content-start " >
                         <HeadTab />
                        </div>

                     
                         <div className="row justify-content-start " >
                            
                            <div className="col-sm-1" >
                            <MenuTab_Small />
                            </div>

                            <div className="col-sm-11">
                            <div>
                            <Payinput/>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={()=>PrintS()}>Primary</button>
                            </div>
                    
                        </div>
                        
        </div>
    )
}
export default SettingPrintPage