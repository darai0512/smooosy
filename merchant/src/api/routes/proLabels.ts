import { Request, Response } from 'express'
import { ProLabel } from '../models'
import { Lean, models } from '../interfaces'

export default {
  index,
  indexForAdmin,
  showForAdmin,
  create,
  update,
  remove,
}

export async function index(req: Request, res: Response) {
  const cond: any = {
    userEditable: true,
  }
  const services = req.query.services
  if (services) cond.services = {$in: services}

  const labels: Lean<models.ProLabel.Model>[] = await ProLabel.find(cond).lean()

  res.json({labels})
}

export async function indexForAdmin(req: Request, res: Response) {
  const cond: any = {}
  const services = req.query.services
  if (services) cond.services = {$in: services}

  const labels: Lean<models.ProLabel.Model>[] = await ProLabel
    .find(cond)
    .sort('-createdAt')
    .lean()

  res.json({labels})
}

export async function showForAdmin(req: Request, res: Response) {
  const labels = await ProLabel
    .find({services: req.params.id})
    .lean()

  res.json({labels})
}

export async function create(req: Request, res: Response) {
  const { services, text, userEditable }: { services: string[], text: string, userEditable: boolean} = req.body
  const exists = await ProLabel.exists({text, userEditable})
  if (exists) return res.status(409).json({message: 'already exists'})

  const label = await ProLabel.create({services, text, userEditable})

  res.json({label})
}

export async function update(req: Request, res: Response) {
  const id = req.params.id
  const { services, text, userEditable }: { services: string[], text: string, userEditable: boolean} = req.body

  const exists = await ProLabel.exists({_id: id})
  if (!exists) return res.status(404).json({message: 'not found'})

  const conflicts = await ProLabel.findOne({text, userEditable}).select('_id').lean()
  if (conflicts && !conflicts._id.equals(id)) return res.status(409).json({message: 'already exists'})

  await ProLabel.updateOne({_id: id}, {$set: {services, text, userEditable}})

  const label = await ProLabel.findById(id).lean()
  res.json({label})
}

export async function remove(req: Request, res: Response) {
  const proLabel = await ProLabel.findByIdAndRemove(req.params.id)
  if (!proLabel) return res.status(404).json({message: 'not found'})

  res.status(200).end()
}
