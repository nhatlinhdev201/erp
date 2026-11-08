// src/app/[locale]/(tenant)/[tenantId]/employee-experience/feed/page.tsx
// Company Feed Page

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Megaphone,
  Newspaper,
  Calendar,
  PartyPopper,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pin,
  Eye,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react'

// Mock data
const mockPosts = [
  {
    id: '1',
    type: 'ANNOUNCEMENT',
    title: 'Q4 Company Results & 2024 Strategy Update',
    content: 'I am excited to share our Q4 results and outline our strategic priorities for 2024. We achieved 120% of our revenue target and expanded to 3 new markets. In the coming year, we will focus on product innovation, customer success, and team growth. Please join us for the All-Hands meeting next Friday to discuss in detail.',
    author: {
      name: 'Nguyen Van CEO',
      avatar: '',
      position: 'Chief Executive Officer',
    },
    isPinned: true,
    publishedAt: '2 hours ago',
    reactions: [
      { emoji: '👏', count: 45 },
      { emoji: '🚀', count: 32 },
      { emoji: '❤️', count: 28 },
    ],
    comments: 12,
    reads: 198,
    totalEmployees: 248,
  },
  {
    id: '2',
    type: 'EVENT',
    title: 'Annual Company Retreat - Phu Quoc 2024',
    content: 'Save the date! Our annual company retreat will be held in Phu Quoc from March 15-17, 2024. This year\'s theme is "Building Tomorrow Together". Expect team-building activities, strategy sessions, and lots of fun!',
    author: {
      name: 'Tran Thi HR',
      avatar: '',
      position: 'HR Director',
    },
    isPinned: false,
    publishedAt: 'Yesterday',
    event: {
      startDate: 'March 15, 2024',
      endDate: 'March 17, 2024',
      location: 'Phu Quoc Island',
      isVirtual: false,
      attendees: { going: 156, maybe: 45, notGoing: 12 },
    },
    reactions: [
      { emoji: '🎉', count: 78 },
      { emoji: '🏖️', count: 54 },
    ],
    comments: 23,
  },
  {
    id: '3',
    type: 'CELEBRATION',
    title: 'Celebrating 5 Years with L-ERP HRM! 🎂',
    content: 'Please join us in congratulating the following team members on their 5-year work anniversary: Nguyen Van A (Engineering), Tran Thi B (Product), and Le Van C (Sales). Thank you for your dedication and contributions to our success!',
    author: {
      name: 'HR Team',
      avatar: '',
      position: 'Human Resources',
    },
    isPinned: false,
    publishedAt: '2 days ago',
    reactions: [
      { emoji: '🎉', count: 89 },
      { emoji: '👏', count: 67 },
      { emoji: '❤️', count: 45 },
    ],
    comments: 34,
  },
  {
    id: '4',
    type: 'POLL',
    title: 'Office Snack Preferences Survey',
    content: 'We\'re updating our office snack selection! Vote for your preferred options below.',
    author: {
      name: 'Office Admin',
      avatar: '',
      position: 'Office Manager',
    },
    isPinned: false,
    publishedAt: '3 days ago',
    poll: {
      options: [
        { text: 'Fresh fruits', votes: 87, percentage: 35 },
        { text: 'Healthy snack bars', votes: 62, percentage: 25 },
        { text: 'Vietnamese snacks', votes: 50, percentage: 20 },
        { text: 'Mixed nuts', votes: 49, percentage: 20 },
      ],
      totalVotes: 248,
      endsAt: 'In 2 days',
    },
    reactions: [],
    comments: 8,
  },
]

const upcomingEvents = [
  {
    id: '1',
    title: 'All-Hands Meeting',
    date: 'Jan 26, 2024',
    time: '3:00 PM',
    isVirtual: true,
  },
  {
    id: '2',
    title: 'Engineering Team Lunch',
    date: 'Jan 27, 2024',
    time: '12:00 PM',
    location: 'Office Cafeteria',
  },
  {
    id: '3',
    title: 'Company Retreat',
    date: 'Mar 15-17, 2024',
    location: 'Phu Quoc',
  },
]

export default function FeedPage() {
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [postType, setPostType] = useState<string>('ANNOUNCEMENT')

  const getTypeBadge = (type: string) => {
    const config: Record<string, { icon: any; color: string; label: string }> = {
      ANNOUNCEMENT: { icon: Megaphone, color: 'bg-red-100 text-red-800', label: 'Announcement' },
      NEWS: { icon: Newspaper, color: 'bg-blue-100 text-blue-800', label: 'News' },
      EVENT: { icon: Calendar, color: 'bg-green-100 text-green-800', label: 'Event' },
      CELEBRATION: { icon: PartyPopper, color: 'bg-yellow-100 text-yellow-800', label: 'Celebration' },
      POLL: { icon: BarChart3, color: 'bg-purple-100 text-purple-800', label: 'Poll' },
    }
    const { icon: Icon, color, label } = config[type] || config.NEWS
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Feed</h1>
          <p className="text-muted-foreground">
            Stay updated with company news, events, and announcements
          </p>
        </div>
        <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>
                Share news, announcements, or events with your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNOUNCEMENT">
                      <span className="flex items-center">
                        <Megaphone className="h-4 w-4 mr-2" />
                        Announcement
                      </span>
                    </SelectItem>
                    <SelectItem value="NEWS">
                      <span className="flex items-center">
                        <Newspaper className="h-4 w-4 mr-2" />
                        News
                      </span>
                    </SelectItem>
                    <SelectItem value="EVENT">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Event
                      </span>
                    </SelectItem>
                    <SelectItem value="CELEBRATION">
                      <span className="flex items-center">
                        <PartyPopper className="h-4 w-4 mr-2" />
                        Celebration
                      </span>
                    </SelectItem>
                    <SelectItem value="POLL">
                      <span className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Poll
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Enter post title" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Write your post content..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>
                    <SelectItem value="DEPARTMENT">Specific Departments</SelectItem>
                    <SelectItem value="MANAGERS">Managers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreatePostOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setCreatePostOpen(false)}>
                  Publish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="polls">Polls</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {mockPosts.map((post) => (
                <Card key={post.id} className={post.isPinned ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>
                          {post.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{post.author.name}</span>
                              {getTypeBadge(post.type)}
                              {post.isPinned && (
                                <Badge variant="outline" className="text-xs">
                                  <Pin className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {post.author.position} · {post.publishedAt}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Pin className="h-4 w-4 mr-2" />
                                {post.isPinned ? 'Unpin' : 'Pin'} post
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h3 className="font-semibold mt-3">{post.title}</h3>
                        <p className="mt-2 text-sm">{post.content}</p>

                        {/* Event Details */}
                        {post.event && (
                          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {post.event.startDate} - {post.event.endDate}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {post.event.isVirtual ? (
                                <>
                                  <Video className="h-4 w-4" />
                                  Virtual Event
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4" />
                                  {post.event.location}
                                </>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Going ({post.event.attendees.going})
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                <HelpCircle className="h-4 w-4 mr-1" />
                                Maybe ({post.event.attendees.maybe})
                              </Button>
                              <Button size="sm" variant="ghost" className="flex-1">
                                <XCircle className="h-4 w-4 mr-1" />
                                No ({post.event.attendees.notGoing})
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Poll */}
                        {post.poll && (
                          <div className="mt-4 space-y-3">
                            {post.poll.options.map((option, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{option.text}</span>
                                  <span className="font-medium">{option.percentage}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${option.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              {post.poll.totalVotes} votes · Ends {post.poll.endsAt}
                            </p>
                          </div>
                        )}

                        {/* Reactions & Comments */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            {post.reactions.map((reaction, index) => (
                              <Button key={index} variant="ghost" size="sm" className="h-8 px-2">
                                <span className="mr-1">{reaction.emoji}</span>
                                <span className="text-xs">{reaction.count}</span>
                              </Button>
                            ))}
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="h-8">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments}
                            </Button>
                            {post.reads !== undefined && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {post.reads} / {post.totalEmployees}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              {mockPosts
                .filter((p) => p.type === 'ANNOUNCEMENT')
                .map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {post.author.name} · {post.publishedAt}
                      </p>
                      <p className="mt-2 text-sm">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {mockPosts
                .filter((p) => p.type === 'EVENT')
                .map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold">{post.title}</h3>
                      {post.event && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {post.event.startDate}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="polls" className="space-y-4">
              {mockPosts
                .filter((p) => p.type === 'POLL')
                .map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
                      <span className="text-xs font-medium">
                        {event.date.split(' ')[0].slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {event.date.split(' ')[1]?.replace(',', '') || event.date.split('-')[0].split(' ')[1]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.time && <>{event.time} · </>}
                        {event.isVirtual ? 'Virtual' : event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Events
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Feed Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unread posts</span>
                  <Badge>12</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active polls</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This week's posts</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Birthdays & Anniversaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-yellow-500" />
                Celebrations
              </CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>NA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Nguyen Van A</p>
                    <p className="text-xs text-muted-foreground">🎂 Birthday - Jan 26</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>TB</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Tran Thi B</p>
                    <p className="text-xs text-muted-foreground">🎉 3 Years - Jan 28</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
