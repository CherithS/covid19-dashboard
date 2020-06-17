import { navigate } from "gatsby";
import React, { useState } from "react";
import styled from "styled-components";

import Colors from "../design-system/Colors";
import { MarkColors } from "../design-system/Colors";
import iconAddSrc from "../design-system/icons/ic_add.svg";
import Loading from "../design-system/Loading";
import TextLabel from "../design-system/TextLabel";
import { useFacilities } from "../facilities-context";
import { useFlag } from "../feature-flags";
import { useCurrentCurveData } from "../hooks/useCurrentCurveData";
import { useEpidemicModelState } from "../hooks/useEpidemicModelState";
import useRejectionToast from "../hooks/useRejectionToast";
import ChartArea from "../impact-dashboard/ChartArea";
import { EpidemicModelProvider } from "../impact-dashboard/EpidemicModelContext";
import { getCurveChartData } from "../impact-dashboard/responseChartData";
import { getFacilitiesRtDataById } from "../infection-model/rt";
import { useLocaleDataState } from "../locale-data-context";
import { publicCurvesAndCaseToggles } from "../page-multi-facility/curveToggles";
import useScenario from "../scenario-context/useScenario";
import FacilityRow from "./FacilityRow";
import FacilityRowPlaceholder from "./FacilityRowPlaceholder";
import ProjectionsHeader from "./ProjectionsHeader";
import RateOfSpreadPanel from "./RateOfSpreadPanel";
import ScenarioSidebar from "./ScenarioSidebar";
import SystemSummary from "./SystemSummary";
import { Facility } from "./types";

const MultiFacilityImpactDashboardContainer = styled.main.attrs({
  className: `
    flex
    mt-8
  `,
})``;

const AddFacilityButton = styled.button`
  color: ${Colors.forest};
  cursor: pointer;
  font-family: "Libre Baskerville", serif;
  font-size: 24px;
  letter-spacing: -0.06em;
  line-height: 24px;
  text-align: left;
  padding-bottom: 0.75rem;
`;

const IconAdd = styled.img`
  display: inline;
  width: 20px;
  height: 20px;
  margin-right: 8px;
`;

const AddFacilityButtonText = styled.span`
  vertical-align: middle;
`;

const ScenarioTabs = styled.div``;

const ScenarioTabList = styled.ul`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  cursor: pointer;
`;

const ScenarioTab = styled.li<{ active?: boolean }>`
  opacity: 0.7;
  margin: 0 0 0 32px;

  ${(props) =>
    props.active
      ? `
    opacity: 1;
    border-bottom: 4px solid ${Colors.teal};
    padding-bottom: 1.5rem;
  `
      : null}
`;

const MultiFacilityImpactDashboard: React.FC = () => {
  const rejectionToast = useRejectionToast();
  const showRateOfSpreadTab = useFlag(["showRateOfSpreadTab"]);
  const { data: localeDataSource } = useLocaleDataState();
  const [scenario] = useScenario();
  const scenarioId = scenario?.data?.id;
  const {
    state: facilitiesState,
    actions: { createOrUpdateFacility, deselectFacility },
  } = useFacilities();
  const facilities = Object.values(facilitiesState.facilities);
  const rtData = getFacilitiesRtDataById(facilitiesState.rtData, facilities);
  const epidemicModelStates = useEpidemicModelState(
    facilities,
    localeDataSource,
  );
  const curveChartInputs = useCurrentCurveData(
    epidemicModelStates,
    localeDataSource,
  );
  const curvedChartData = getCurveChartData(curveChartInputs);

  const handleFacilitySave = async (facility: Facility) => {
    if (scenarioId) {
      await rejectionToast(createOrUpdateFacility(scenarioId, facility));
    }
  };

  const openAddFacilityPage = () => {
    deselectFacility();
    navigate("/facility");
  };

  const [selectedTab, setSelectedTab] = useState(0);

  const projectionsPanel = (
    <>
      <ProjectionsHeader />
      {facilitiesState.loading ? (
        <Loading />
      ) : (
        facilities.map((facility) => (
          <FacilityRowPlaceholder key={facility.id}>
            <EpidemicModelProvider
              facilityModel={facility.modelInputs}
              localeDataSource={localeDataSource}
            >
              <FacilityRow
                facility={facility}
                facilityRtData={rtData && rtData[facility.id]}
                onSave={handleFacilitySave}
              />
            </EpidemicModelProvider>
          </FacilityRowPlaceholder>
        ))
      )}
    </>
  );

  return (
    <MultiFacilityImpactDashboardContainer>
      {scenario.loading ? (
        <Loading />
      ) : (
        <ScenarioSidebar numFacilities={facilities.length} />
      )}
      <div className="flex flex-col flex-1 pb-6 pl-8 justify-start">
        {rtData && (
          <SystemSummary
            facilities={facilities}
            scenarioId={scenario?.data?.id}
            rtData={rtData}
          />
        )}
        <ChartArea
          chartData={curvedChartData}
          addAnnotations={false}
          markColors={MarkColors}
          initialCurveToggles={publicCurvesAndCaseToggles}
        />
        <div className="flex flex-row flex-none justify-between items-start">
          <AddFacilityButton onClick={openAddFacilityPage}>
            <IconAdd alt="add facility" src={iconAddSrc} />
            <AddFacilityButtonText>Add Facility</AddFacilityButtonText>
          </AddFacilityButton>
          <ScenarioTabs>
            <ScenarioTabList>
              <ScenarioTab
                active={selectedTab === 0}
                onClick={() => setSelectedTab(0)}
              >
                <TextLabel padding={false}>Projections</TextLabel>
              </ScenarioTab>
              {showRateOfSpreadTab ? (
                <ScenarioTab
                  active={selectedTab === 1}
                  onClick={() => setSelectedTab(1)}
                >
                  <TextLabel padding={false}>Rate of spread</TextLabel>
                </ScenarioTab>
              ) : null}
            </ScenarioTabList>
          </ScenarioTabs>
        </div>
        {selectedTab === 0 && projectionsPanel}
        {selectedTab === 1 && (
          <RateOfSpreadPanel
            facilities={facilities}
            loading={facilitiesState.loading}
          />
        )}
      </div>
    </MultiFacilityImpactDashboardContainer>
  );
};

export default MultiFacilityImpactDashboard;
