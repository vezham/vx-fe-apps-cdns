'use client'

import { useState } from 'react'

import { CheckCircle, QuestionCircle } from '@vezham/icons-react'
import { Button as ButtonV2 } from '@vezham/react-v2'
import {
  Avatar,
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  Link,
  Separator,
  TextField,
  Tooltip,
  buttonVariants
} from '@vezham/react-v3'
import { useLogger } from '@vezham/use-logger'

import { PageEmptyState } from './empty-state'
import { Posts } from './posts'

const NAMESPACE = 'App/Home'

type Props = {
  onPress: () => void
}

export const Home = ({ onPress }: Props) => {
  const [value, setValue] = useState('')
  const isInvalid = value.length > 0 && value.length < 3

  useLogger.log(NAMESPACE, 'Hello World :)')
  useLogger.debug(NAMESPACE, 'Hello World :)')
  useLogger.info(NAMESPACE, 'Hello World :)')
  useLogger.warn(NAMESPACE, 'Hello World :)')
  useLogger.error(NAMESPACE, 'Hello World :)')
  return (
    <>
      <div className="flex items-center gap-6">
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="User avatar">
            <Avatar size="sm">
              <Avatar.Image
                alt="Jane Doe"
                // wjdlz/TODO: serve from cdn
                src="https://img.heroui.chat/image/avatar?w=400&h=400&u=4"
              />
              <Avatar.Fallback>JD</Avatar.Fallback>
            </Avatar>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <div className="flex flex-col gap-0 py-1">
              <p className="font-semibold">Jane Doe</p>
              <p className="text-muted text-xs">jane@example.com</p>
            </div>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="Status chip">
            <Chip color="success">
              <CheckCircle size={12} weight="filled" />
              Active
            </Chip>
          </Tooltip.Trigger>
          <Tooltip.Content className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>
            <p>Jane is currently online</p>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="Info icon">
            <div className="bg-accent-soft rounded-full p-2">
              <QuestionCircle className="text-accent" size={16} />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <div className="max-w-xs px-1 py-1.5">
              <p className="mb-1 font-semibold">Help Information</p>
              <p className="text-muted text-sm">
                This is a helpful tooltip with more detailed information about
                this feature.
              </p>
            </div>
          </Tooltip.Content>
        </Tooltip>
      </div>

      <TextField className="w-64" isInvalid={isInvalid}>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Enter username"
          value={value}
          onChange={e => setValue((e.target as HTMLInputElement).value)}
        />
        <FieldError>Username must be at least 3 characters</FieldError>
      </TextField>

      <Button children="Hello World :) - v3" />
      <ButtonV2
        children="Hello World :) - v2"
        color="success"
        variant="solid"
      />

      <Link onPress={onPress}>
        Pro - Demo
        <Link.Icon />
      </Link>

      <Link
        href="/hello-world"
        className={buttonVariants({ variant: 'danger-soft' })}>
        <Link.Icon />
        Hello World :|
        <Link.Icon />
      </Link>

      <Separator />

      <PageEmptyState />

      <Separator />

      <div>Welcome to Static CDN!...</div>
      <Posts />
    </>
  )
}
