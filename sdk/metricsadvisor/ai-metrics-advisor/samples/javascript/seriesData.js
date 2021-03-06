// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This sample demonstrates Detection Configuration CRUD operations.
 */
// Load the .env file if it exists
require("dotenv").config();

const { MetricsAdvisorKeyCredential, MetricsAdvisorClient } = require("@azure/ai-metrics-advisor");

async function main() {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["METRICS_ADVISOR_ENDPOINT"] || "<service endpoint>";
  const subscriptionKey = process.env["METRICS_ADVISOR_SUBSCRIPTION_KEY"] || "<subscription key>";
  const apiKey = process.env["METRICS_ADVISOR_API_KEY"] || "<api key>";
  const metricId = process.env["METRICS_ADVISOR_METRIC_ID"] || "<metric id>";
  const detectionConfigId =
    process.env["METRICS_ADVISOR_DETECTION_CONFIG_ID"] || "<detection config id>";

  const credential = new MetricsAdvisorKeyCredential(subscriptionKey, apiKey);

  const client = new MetricsAdvisorClient(endpoint, credential);

  await getMetricSeriesData(client, metricId);

  await getEnrichedSeriesData(client, detectionConfigId);
}

// get enriched series data for a detection configuration
async function getEnrichedSeriesData(client, detectionConfigId) {
  console.log("Retrieving metric enriched series data...");
  try {
    const result = await client.getMetricEnrichedSeriesData(
      detectionConfigId,
      new Date("01/01/2020"),
      new Date("09/12/2020"),
      [
        { dimension: { Dim1: "Common Lime", Dim2: "Amphibian" } },
        { dimension: { Dim1: "Common Beech", Dim2: "Ant" } }
      ]
    );

    for (const r of result.results || []) {
      console.log("series:");
      console.log(r.series);
      console.log("isAbnomalList:");
      console.table(r.isAnomalyList);
      console.log("expectedValueList:");
      console.table(r.expectedValueList);
    }
  } catch (err) {
    console.log("!!!!!  error in listing enriched series data");
    console.log(err);
  }
}

async function getMetricSeriesData(client, metricId) {
  console.log("Retrieving metric series data...");
  try {
    const result = await client.getMetricSeriesData(
      metricId,
      new Date("09/01/2020"),
      new Date("09/12/2020"),
      [
        { Dim1: "Common Lime", Dim2: "Amphibian" },
        { Dim1: "Common Beech", Dim2: "Ant" }
      ]
    );

    for (const r of result.metricSeriesDataList || []) {
      console.dir(r);
    }
  } catch (err) {
    console.log("!!!!!  error in listing metric series data");
    console.log(err);
  }
}

main()
  .then((_) => {
    console.log("Succeeded");
  })
  .catch((err) => {
    console.log("Error occurred:");
    console.log(err);
  });
