import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Upload, FileText } from 'lucide-react'

export default function Home() {
    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
                </div>

                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center animate-slide-up">
                    <div className="mb-8 flex justify-center">
                        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 bg-white/50 backdrop-blur-sm">
                            Powered by GPT-4o <span className="font-semibold text-indigo-600 ml-1">AI Analysis</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                        Transform Your Resume into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Job Magnet</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Stop guessing. Get instant, AI-driven feedback on your resume. Uncover skill gaps, beat the ATS bots, and prep for interviews with confidence.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/login"
                            className="rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center"
                        >
                            Start Analyzing Free <ArrowRight className="inline w-4 h-4 ml-2" />
                        </Link>
                        <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors">
                            Learn more <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>

                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                    <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
                </div>
            </div>

            {/* Feature Section */}
            <div id="features" className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Faster Hired</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to ace the application</p>
                </div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4 p-6 bg-white rounded-2xl shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-transform cursor-default">
                        <dt className="text-base leading-7 text-gray-600 flex flex-col items-center">
                            <div className="mb-6 rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                                <Upload className="h-8 w-8" />
                            </div>
                            Smart Parsing
                        </dt>
                        <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">Upload & Analyze</dd>
                        <p className="text-sm text-gray-500">Instant extraction of your experience from PDF or Docx files.</p>
                    </div>

                    <div className="mx-auto flex max-w-xs flex-col gap-y-4 p-6 bg-white rounded-2xl shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-transform cursor-default">
                        <dt className="text-base leading-7 text-gray-600 flex flex-col items-center">
                            <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            ATS Compatible
                        </dt>
                        <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">Beat the Bots</dd>
                        <p className="text-sm text-gray-500">See exactly what the tracking systems see and fix formatting errors.</p>
                    </div>

                    <div className="mx-auto flex max-w-xs flex-col gap-y-4 p-6 bg-white rounded-2xl shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-transform cursor-default">
                        <dt className="text-base leading-7 text-gray-600 flex flex-col items-center">
                            <div className="mb-6 rounded-2xl bg-purple-50 p-4 text-purple-600">
                                <FileText className="h-8 w-8" />
                            </div>
                            Interview Prep
                        </dt>
                        <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">Get Ready</dd>
                        <p className="text-sm text-gray-500">Get generated interview questions specifically for your resume and the job.</p>
                    </div>
                </dl>
            </div>
        </div>
    )
}
