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