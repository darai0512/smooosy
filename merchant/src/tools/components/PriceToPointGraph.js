import React from 'react'
import curveFitting from 'ml-levenberg-marquardt'
import { Line } from 'react-chartjs-2'

export default ({ pricesToPoints, width, height }) => {
  const curveFitData = {
    x: pricesToPoints.map(m => m.price),
    y: pricesToPoints.map(m => m.points),
  }

  const curveFitOptions = {
    damping: 10e-7,
    initialValues: [1, 1, 1],
    maxIterations: 1000,
  }

  const { parameterValues: [ a, b, c ] } = curveFitting(
    curveFitData,
    ([a, b, c]) => (x) => a * Math.log(b + x) + c,
    curveFitOptions
  )

  const curve = x => {
    return +(a * Math.log(x + b) + c).toFixed(5)
  }

  const upper = pricesToPoints[pricesToPoints.length - 1]

  const graphOptions = {
    responsive: true,
    scales: {
      yAxes: [{
        type: 'linear',
        position: 'left',
        reverse: true,
        ticks: {
          min: 0,
          max: upper.points,
          stepSize: upper.points / 10,
        },
      }],
      xAxes: [{
        type: 'linear',
        position: 'bottom',
        ticks: {
          min: 0,
          max: upper.price,
          stepSize: upper.price / 10,
        },
      }],
    },
    elements: {
      point: {
        radius: 2,
      },
    },
  }

  const data = {
    datasets: [{
      data: [],
      label: 'Budget price to base point',
      borderColor: 'green',
      fill: false,
      pointHitRadius: 7,
    }],
  }

  const stepSize = upper.price / 50

  for (let x = 0; x <= upper.price; x += stepSize) {
    data.datasets[0].data.push({ x, y: curve(x) })
  }

  return (
    <React.Fragment>
      <h3>予算vsポイント図表</h3>
      <Line data={data} width={width} height={height} options={graphOptions} />
    </React.Fragment>
  )
}