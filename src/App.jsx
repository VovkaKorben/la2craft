import { useState, useEffect } from 'react'
import './App.css'
import TextInput from './comps/TextInput.jsx';
import ButtonSelector from './comps/ButtonSelector.jsx';
import { loadArrayFromLS } from './utils.jsx';


function App() {

  const [itemSearch, setItemSearch] = useState(localStorage.getItem("itemSearch") || "");
  const [filterType, setFilterType] = useState(() => loadArrayFromLS("filterType", 3));
  const [filterGrade, setFilterGrade] = useState(() => loadArrayFromLS("filterGrade", 5));

  useEffect(() => { localStorage.setItem("itemSearch", itemSearch); }, [itemSearch]);
  useEffect(() => { localStorage.setItem("filterType", JSON.stringify(filterType)); }, [filterType]);
  useEffect(() => { localStorage.setItem("filterGrade", JSON.stringify(filterGrade)); }, [filterGrade]);

  const itemSearchChanged = (value) => { setItemSearch(value); }
  const filterTypeChanged = (value) => { setFilterType(value); }
  const filterGradeChanged = (value) => { setFilterGrade(value); }

  return (
    <div className="container">
      <div className="item_search">
        <TextInput
          onChange={itemSearchChanged}
          initValue={itemSearch}
        />
      </div>
      <div className="type_selector">
        <ButtonSelector
          initValue={filterType}
          onChange={filterTypeChanged}
          type="type"
        />
      </div>
      <div className="grade_selector">
        <ButtonSelector
          initValue={filterGrade}
          onChange={filterGradeChanged}
          type="grade"
        />
      </div>
      <div className="search_list">search_list</div>
      <div className="history_list">history_list</div>
      <div className="current_schedule">current_schedule</div>
      <div className="solution">solution</div>
    </div>
  )
}

export default App;
