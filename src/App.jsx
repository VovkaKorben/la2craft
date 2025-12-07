import { useState, useEffect } from 'react'
import './App.css'
import TextInput from './comps/TextInput.jsx';


function App() {

  const [itemSearch, setItemSearch] = useState(localStorage.getItem("itemSearch") || "");
  useEffect(() => {
    localStorage.setItem("itemSearch", itemSearch);
  }, [itemSearch]);

  const itemSearchChanged = (value) => {
    setItemSearch(value);
  }


  return (
    <div className="container">
      <div className="item_search">
        <TextInput
          onChange={itemSearchChanged}
          initValue={itemSearch}
        />
      </div>
      <div className="type_selector">type_selector</div>
      <div className="grade_selector">grade_selector</div>
      <div className="search_list">search_list</div>
      <div className="history_list">history_list</div>
      <div className="current_schedule">current_schedule</div>
      <div className="solution">solution</div>
    </div>
  )
}

export default App;
